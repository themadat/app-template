# Goal
Move SF Symbol fill, opacity, and stroke attributes before geometry attributes.
# Status
COMPLETE
# Checkpoint
None.
# Completed
- Inspected catalog serialization and inline interface symbols; working tree started clean.
- Reordered all 6,918 SF Symbols across five weights and inline UI SVGs; future catalog serialization applies the same formatter.
- Updated version, release, cache, manifest, deployment, and documentation surfaces to 0.0.1.72.
# Remaining
- None.
# Verification
- Build: PASS — static app; compiler and application syntax verified.
- Tests: PASS — compared all 7,281 catalog records with HEAD; only SF Symbol attribute ordering changed. Checked 41,557 SVG strings for unchanged attributes and idempotent formatting.
- Lint: PASS — git diff --check; manifests parse and referenced manifest assets exist.
- Review: PASS — all weights covered; custom catalog artwork and metadata unchanged.
# Next
Ready for the user to commit and push 0.0.1.72.
# Decisions
- Keep paint attributes immediately after each opening element name, before path data or geometry.
- Preserve attribute values and relative order; leave custom catalog icons unchanged.
