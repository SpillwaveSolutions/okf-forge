# e2e persistence spec writes into the tracked public/sample-okf fixture

`01KZ4FN7VEE25SEF6JCFG5J90T` · task/bug · **done**

e2e/persistence.spec.ts saves through /api/fs into the real public/sample-okf tree rather than a per-run temp copy, so every local run leaves an e2e-write-<timestamp>.md behind.
