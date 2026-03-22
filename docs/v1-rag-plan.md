# V1 RAG Introduction Plan

## Goal

Introduce retrieval only after MVP validates workflow and state control.

## Why RAG Comes After MVP

Without a stable artifact system, RAG adds complexity without clarity. The correct order is:
1. define state
2. prove workflow
3. observe context bottlenecks
4. add retrieval to solve those bottlenecks

## Problems RAG Should Solve in V1

- packet size growth as projects get longer
- missed canon references in later chapters
- weak continuity checks across many chapters
- inability to efficiently retrieve relevant development chains and unresolved threads

## Retrieval Scope in V1

Only project-internal retrieval. No external research.

### Retrieve from:
- confirmed story bible entries
- confirmed character cards and character state summaries
- chapter summaries
- timeline events
- unresolved threads
- development chains
- prior QA issues

## Retrieval Use Cases

### Producer
Build more relevant context packets.

### Planner
Find dependencies, callbacks, unresolved threads, and development chain nodes.

### Writer
Retrieve only canon and recent story state relevant to current scenes.

### QA
Retrieve evidence sources for conflicts and compare draft claims against canon.

## Migration Strategy

### V0
Static packet compiler:
- recent chapter summaries
- current canon summary
- current characters summary

### V1
Task-aware retrieval packet compiler:
- classify task
- retrieve task-specific artifact set
- merge into packet sections with size budget

## Retrieval Readiness Criteria

Do not start V1 until:
- artifact schemas are stable
- chapter summaries exist
- canonical read models are reliable
- QA report schema is stable

