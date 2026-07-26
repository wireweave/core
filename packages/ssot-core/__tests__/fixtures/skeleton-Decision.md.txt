---
id: decision.CHANGE-ME
kind: Decision
title: CHANGE ME
purpose: ""            # [축①] 이 결정이 답한 질문
definition: ""         # [축②] 무엇을 결정했나 (한 문장)
relatesTo: []          # [축②] 이 결정이 만든/바꾼 대상 [{ to, type, note? }] — type 은 x-edge-types 표준 어휘 사용
supersedes: []         # 이 결정이 대체하는 이전 decision.* id (append-only 체인)
owner: TBD             # [축④]
lifecycle: active      # [축④] active | deprecated(=superseded)
confidence: high       # 결정은 기록 시점에 확정이므로 보통 high
lastVerified: ""       # [축④] YYYY-MM-DD (결정일)
---

<!-- 작성 고도(methodology §0): 비개발자도 읽는 자연어로 — 무엇을·왜·누가·어떤 규칙·무슨 데이터. 코드(테이블·필드·경로·SQL) 옮겨적기 금지(식별자는 provenance/근거에만). 코드 분기/의도 불명은 판정 말고 OPEN. -->

> Decision은 append-only다. 결정이 바뀌면 이 파일을 고치지 말고 새 Decision을 만들어 `supersedes`로 잇는다. (스냅샷 원칙 — 히스토리는 여기와 git에만)

<!-- 본문 섹션은 x-required-sections-by-kind.Decision 와 1:1 정렬. verify가 누락 섹션을 검사한다. -->

## 맥락 (Context)
<!-- 어떤 상황/문제에서 이 결정이 필요했나 -->

## 결정 (Decision)
<!-- 무엇을 택했나 -->

## 근거와 결과 (Consequences)
<!-- 왜 이 선택인가, 그로 인해 무엇이 따라오나(=영향 후보) -->
