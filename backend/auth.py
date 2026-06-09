import os
import msal

CLIENT_ID = os.environ.get('AZURE_CLIENT_ID')
CLIENT_SECRET = os.environ.get('AZURE_CLIENT_SECRET')
TENANT_ID = os.environ.get('AZURE_TENANT_ID')
REDIRECT_URI = os.environ.get('REDIRECT_URI', 'http://localhost:5001/auth/callback')
AUTHORITY = f'https://login.microsoftonline.com/{TENANT_ID}'

SCOPES = ['User.Read']

ALLOWED_DOMAINS = {'thomsonreuters.com', 'reuters.com', 'tr.com'}


def _msal_app():
    return msal.ConfidentialClientApplication(
        client_id=CLIENT_ID,
        client_credential=CLIENT_SECRET,
        authority=AUTHORITY,
    )


def get_auth_flow():
    return _msal_app().initiate_auth_code_flow(scopes=SCOPES, redirect_uri=REDIRECT_URI)


def handle_callback(auth_flow, callback_args):
    result = _msal_app().acquire_token_by_auth_code_flow(
        auth_code_flow=auth_flow,
        auth_response=callback_args,
    )
    if 'access_token' not in result:
        raise ValueError(result.get('error_description', 'Authentication failed'))
    return result


def get_user_info(access_token):
    import urllib.request, json
    req = urllib.request.Request(
        'https://graph.microsoft.com/v1.0/me?$select=displayName,userPrincipalName,mail',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def is_allowed_domain(upn):
    domain = (upn or '').split('@')[-1].lower()
    return domain in ALLOWED_DOMAINS
