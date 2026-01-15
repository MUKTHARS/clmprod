"""
Patch to fix OpenAI client proxy issues
"""
import os
import sys

# Remove ALL proxy environment variables
proxy_vars = [
    'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy',
    'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy',
    'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE'
]

for var in proxy_vars:
    os.environ.pop(var, None)

# Also monkey-patch the OpenAI client to prevent proxy issues
import openai._base_client

original_init = openai._base_client.SyncHttpxClientWrapper.__init__

def patched_init(self, **kwargs):
    # Remove proxies from kwargs if present
    kwargs.pop('proxies', None)
    kwargs.pop('proxy', None)
    return original_init(self, **kwargs)

openai._base_client.SyncHttpxClientWrapper.__init__ = patched_init

# Patch the async client too
original_async_init = openai._base_client.AsyncHttpxClientWrapper.__init__

def patched_async_init(self, **kwargs):
    kwargs.pop('proxies', None)
    kwargs.pop('proxy', None)
    return original_async_init(self, **kwargs)

openai._base_client.AsyncHttpxClientWrapper.__init__ = patched_async_init

print("✓ OpenAI proxy patches applied")