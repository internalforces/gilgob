---
title: "Oracle 계층형 쿼리로 조직도 탐색하기"
description: "CONNECT BY를 사용해 Oracle 조직도 데이터를 순회한 학습 기록이다."
category: "Learning"
tags: ["Oracle", "SQL", "Hierarchical Query"]
created: 2026-08-20
updated: 2026-08-20
draft: false
aliases: ["Oracle Hierarchical Query"]
featured: false
---

`START WITH`와 `CONNECT BY PRIOR`를 사용하면 부모-자식 관계를 순회할 수 있다. 인덱스 설계의 배경은 [[B-Tree는 왜 DB Index에 사용될까?]]에서 다시 확인한다.
