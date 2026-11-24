# Native extension fixtures

Four independent, single-file examples target the Open WebUI v0.13.4 [native loader](https://github.com/open-webui/open-webui/blob/0666e59d26a4d056e0bacee41742486badd71cf8/backend/open_webui/utils/plugin.py). They have no network or credential dependencies.

| File | Staging acceptance check |
| --- | --- |
| [Pipe](pipe.py) | Create and enable the Function, select the resulting model in a test chat, and confirm its fixed reply. |
| [Filter](filter.py) | Attach it to a test model. Inspect a synthetic chat request after its inlet and confirm streaming is disabled while messages and model selection are preserved. |
| [Action](action.py) | Attach it to a test model and activate the action on a message. Check the notification displays the count from the action payload. |
| [Tools](tools.py) | Add the toolkit in Workspace, grant it to a test user, and enable it on a tool-capable model. Verify a clock tool call returns a UTC timestamp. |

Run `python3 -m unittest discover -s examples/openwebui-native -v` from the repository root. These tests call the Python hooks directly. Test loading, visibility, dispatch and event rendering separately in the target WebUI. Remove the staging model attachments, disable the Functions and revoke tool access after the exercise.
