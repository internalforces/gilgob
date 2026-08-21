const RENDER_RESOURCE_TYPES = new Set([
  'document',
  'stylesheet',
  'script',
  'font',
  'image',
]);

function resourceLabel(request) {
  return `${request.resourceType()} ${request.url()}`;
}

export function createPageResourceAudit(page) {
  const failures = [];
  const onRequestFailed = (request) => {
    if (!RENDER_RESOURCE_TYPES.has(request.resourceType())) return;
    failures.push(
      `${resourceLabel(request)} request failed: ${request.failure()?.errorText ?? 'unknown error'}`,
    );
  };
  const onResponse = (response) => {
    const request = response.request();
    if (!RENDER_RESOURCE_TYPES.has(request.resourceType())) return;
    const status = response.status();
    if (status < 200 || status >= 300) {
      failures.push(`${resourceLabel(request)} returned HTTP ${status}`);
    }
  };

  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);

  return {
    assertHealthy() {
      if (failures.length > 0) {
        throw new Error(`Portfolio render resources failed:\n- ${failures.join('\n- ')}`);
      }
    },
    dispose() {
      page.off('requestfailed', onRequestFailed);
      page.off('response', onResponse);
    },
  };
}

const DEFAULT_KOREAN_FONTS = Object.freeze([
  { family: 'Noto Sans KR', weight: '400' },
  { family: 'Noto Sans KR', weight: '500' },
  { family: 'Noto Sans KR', weight: '600' },
  { family: 'Noto Sans KR', weight: '700' },
]);
const KOREAN_FONT_SAMPLE = '한글 포트폴리오 검증';

export async function assertPageRenderAssets(page, {
  requiredKoreanFonts = DEFAULT_KOREAN_FONTS,
} = {}) {
  const state = await page.evaluate(async ({ fontRequirements, sample }) => {
    const requiredFonts = [];
    for (const requirement of fontRequirements) {
      const shorthand = `${requirement.weight} 16px "${requirement.family}"`;
      try {
        const loadedFaces = await document.fonts.load(shorthand, sample);
        requiredFonts.push({
          ...requirement,
          loadedFaceCount: loadedFaces.length,
          checkPassed: document.fonts.check(shorthand, sample),
        });
      } catch (error) {
        requiredFonts.push({
          ...requirement,
          loadedFaceCount: 0,
          checkPassed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await document.fonts.ready;
    return {
      fontSetStatus: document.fonts.status,
      requiredFonts,
      failedFonts: Array.from(document.fonts)
        .filter((font) => font.status === 'error')
        .map((font) => `${font.family} (${font.weight} ${font.style})`),
      brokenImages: Array.from(document.images)
        .filter((image) => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0)
        .map((image) => image.currentSrc || image.src || image.alt || '<unnamed image>'),
    };
  }, { fontRequirements: requiredKoreanFonts, sample: KOREAN_FONT_SAMPLE });

  const failures = [];
  if (state.fontSetStatus !== 'loaded') {
    failures.push(`document font set remained ${state.fontSetStatus}`);
  }
  if (state.failedFonts.length > 0) {
    failures.push(`font status error: ${state.failedFonts.join(', ')}`);
  }
  for (const font of state.requiredFonts) {
    const label = `${font.family} (${font.weight})`;
    if (font.loadedFaceCount === 0) {
      failures.push(`${label} returned zero loaded faces${font.error ? `: ${font.error}` : ''}`);
    }
    if (!font.checkPassed) failures.push(`${label} document.fonts.check failed`);
  }
  if (state.brokenImages.length > 0) {
    failures.push(`image incomplete or broken: ${state.brokenImages.join(', ')}`);
  }

  if (failures.length > 0) {
    throw new Error(`Portfolio render assets are not ready:\n- ${failures.join('\n- ')}`);
  }
}

export async function assertPortfolioPrintGeometry(page, {
  tolerance = 1,
} = {}) {
  const audit = await page.evaluate(({ allowedDelta }) => {
    const failures = [];
    const sheets = Array.from(document.querySelectorAll('.portfolio-print-sheet'));
    if (!matchMedia('print').matches) {
      failures.push('print media is not active');
    }
    if (sheets.length !== 1) {
      failures.push(`expected one .portfolio-print-sheet; received ${sheets.length}`);
      return { failures };
    }

    const sheet = sheets[0];
    const directScreens = Array.from(sheet.querySelectorAll(':scope > .portfolio-screen'));
    if (directScreens.length !== 2) {
      failures.push(
        `expected exactly two direct .portfolio-print-sheet > .portfolio-screen children; received ${directScreens.length}`,
      );
    }

    const label = (element) => {
      const id = element.id ? `#${element.id}` : '';
      const classes = Array.from(element.classList).map((value) => `.${value}`).join('');
      const fixture = element.hasAttribute('data-geometry-overflow-fixture')
        ? '[data-geometry-overflow-fixture]'
        : '';
      return `${element.tagName.toLowerCase()}${id}${classes}${fixture}`;
    };
    const dimensions = (element) => ({
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      rect: (() => {
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          width: rect.width,
        };
      })(),
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    });
    const inspectBox = (element, ownerLabel) => {
      const measurement = dimensions(element);
      if (measurement.rect.width <= 0 || measurement.rect.height <= 0) {
        failures.push(
          `${ownerLabel} ${label(element)} has non-positive bounds ${measurement.rect.width.toFixed(2)}x${measurement.rect.height.toFixed(2)}`,
        );
      }
      if (measurement.scrollWidth > measurement.clientWidth + allowedDelta) {
        failures.push(
          `${ownerLabel} ${label(element)} scrollWidth ${measurement.scrollWidth} exceeds clientWidth ${measurement.clientWidth}`,
        );
      }
      if (measurement.scrollHeight > measurement.clientHeight + allowedDelta) {
        failures.push(
          `${ownerLabel} ${label(element)} scrollHeight ${measurement.scrollHeight} exceeds clientHeight ${measurement.clientHeight}`,
        );
      }
      return measurement.rect;
    };
    const visibleBounds = (element) => {
      const boxes = [element, ...element.querySelectorAll('*')]
        .map((candidate) => ({
          rect: candidate.getBoundingClientRect(),
          style: getComputedStyle(candidate),
        }))
        .filter(({ rect, style }) => (
          style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity) !== 0
          && rect.width > 0
          && rect.height > 0
        ))
        .map(({ rect }) => rect);
      if (boxes.length === 0) return undefined;
      return {
        bottom: Math.max(...boxes.map((rect) => rect.bottom)),
        top: Math.min(...boxes.map((rect) => rect.top)),
      };
    };

    const sheetRect = inspectBox(sheet, 'print sheet');
    let previousScreenRect;
    for (const screen of directScreens) {
      const screenLabel = `portfolio-screen ${label(screen)}`;
      const screenRect = inspectBox(screen, screenLabel);
      if (
        screenRect.left < sheetRect.left - allowedDelta
        || screenRect.right > sheetRect.right + allowedDelta
        || screenRect.top < sheetRect.top - allowedDelta
        || screenRect.bottom > sheetRect.bottom + allowedDelta
      ) {
        failures.push(
          `${screenLabel} bounds are outside print sheet: screen ${JSON.stringify(screenRect)}, sheet ${JSON.stringify(sheetRect)}`,
        );
      }
      if (previousScreenRect && previousScreenRect.bottom > screenRect.top + allowedDelta) {
        failures.push(
          `${screenLabel} overlaps the previous screen by ${(previousScreenRect.bottom - screenRect.top).toFixed(2)}px`,
        );
      }
      previousScreenRect = screenRect;

      for (const descendant of screen.querySelectorAll('*')) {
        const style = getComputedStyle(descendant);
        const rect = descendant.getBoundingClientRect();
        const visible = style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity) !== 0
          && rect.width > 0
          && rect.height > 0;
        if (!visible) continue;
        if (
          rect.left < screenRect.left - allowedDelta
          || rect.right > screenRect.right + allowedDelta
          || rect.top < screenRect.top - allowedDelta
          || rect.bottom > screenRect.bottom + allowedDelta
        ) {
          failures.push(
            `${screenLabel} visible descendant ${label(descendant)} is outside its owning screen: descendant ${JSON.stringify({
              bottom: rect.bottom,
              left: rect.left,
              right: rect.right,
              top: rect.top,
            })}, screen ${JSON.stringify(screenRect)}`,
          );
        }
      }

      const computedRowGap = Number.parseFloat(getComputedStyle(screen).rowGap);
      const visibleSiblings = Array.from(screen.children)
        .map((element) => ({ element, bounds: visibleBounds(element) }))
        .filter(({ bounds }) => Boolean(bounds));
      for (let index = 1; index < visibleSiblings.length; index += 1) {
        const previous = visibleSiblings[index - 1];
        const current = visibleSiblings[index];
        const visualGap = current.bounds.top - previous.bounds.bottom;
        if (visualGap <= 0) {
          failures.push(
            `${screenLabel} direct siblings ${label(previous.element)} and ${label(current.element)} have visual gap ${visualGap.toFixed(2)}px below required positive separation (computed row gap ${Number.isFinite(computedRowGap) ? computedRowGap.toFixed(2) : 'unavailable'}px)`,
          );
        }
      }
    }

    return { failures };
  }, { allowedDelta: tolerance });

  if (audit.failures.length > 0) {
    throw new Error(`Portfolio print geometry audit failed:\n- ${audit.failures.join('\n- ')}`);
  }
}
