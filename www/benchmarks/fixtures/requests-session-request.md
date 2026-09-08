Constructs a {class}`Request <Request>`, prepares it and sends it.
Returns {class}`Response <Response>` object.

```
param method

method for the new  object.

param url

URL for the new  object.

param params

(optional) Dictionary or bytes to be sent in the query
string for the .

param data

(optional) Dictionary, list of tuples, bytes, or file-like
object to send in the body of the .

param json

(optional) json to send in the body of the
.

param headers

(optional) Dictionary of HTTP Headers to send with the
.

param cookies

(optional) Dict or CookieJar object to send with the
.

param files

(optional) Dictionary of 'filename': file-like-objects
for multipart encoding upload.

param auth

(optional) Auth tuple or callable to enable
Basic/Digest/Custom HTTP Auth.

param timeout

(optional) How many seconds to wait for the server to send
data before giving up, as a float, or a  tuple.

type timeout

float or tuple

param allow_redirects

(optional) Set to True by default.

type allow_redirects

bool

param proxies

(optional) Dictionary mapping protocol or protocol and
hostname to the URL of the proxy.

param hooks

(optional) Dictionary mapping hook name to one event or
list of events, event must be callable.

param stream

(optional) whether to immediately download the response
content. Defaults to False.

param verify

(optional) Either a boolean, in which case it controls whether we verify
the server's TLS certificate, or a string, in which case it must be a path
to a CA bundle to use. Defaults to True. When set to
False, requests will accept any TLS certificate presented by
the server, and will ignore hostname mismatches and/or expired
certificates, which will make your application vulnerable to
man-in-the-middle (MitM) attacks. Setting verify to False
may be useful during local development or testing.

param cert

(optional) if String, path to ssl client cert file (.pem).
If Tuple, ('cert', 'key') pair.

rtype

requests.Response
```
