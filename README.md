# DayOneBuilder site bundle

Static GitHub Pages bundle for the DayOneBuilder trusted agent solution resolver.

## Pages

- `/` - trusted resolver positioning page
- `/dob-task-resolver/` - task-to-solution resolver
- `/agent-registry.json` - machine-readable trusted source registry
- `/agent-actions.json` - machine-readable first-action feed for agents
- `/llms.txt` - agent instructions
- `/sitemap.xml` - primary crawl surface
- old catalog and offer routes are archived and point to `/dob-task-resolver/`

## Payment Note

Do not expose private NOWPayments credentials in client-side code.
Use payment widgets or pre-created invoices only after the operator finishes NOWPayments setup.
