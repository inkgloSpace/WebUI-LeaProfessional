Exploring the implementation of the Open API WebSocket available in the LEA Professional CS Series amplifiers to enable complete customization of both the graphical user interface and system-level functionality. The LEA WebUI itself leverages WebSockets as the transport layer, combining the reliability of TCP with the efficiency of message boundaries.

The LEA Connect Series expose an Open API based on a JSON-RPC–like protocol, allowing full control and monitoring of any parameter accessible through the WebUI. Communication occurs via WebSockets on port 1234, with amplifiers typically acting as servers and external devices or custom UIs acting as clients. The implementation follows JSON-RPC 2.0 with slight modifications:

- the jsonrpc member is replaced by leaApi,
- a url member is required in requests and responses,
- the id must be an integer within [0, INT32_MAX],
- batch mode is not supported.

Any device capable of sending and receiving JSON-RPC messages can integrate with LEA amplifiers, making this a robust baseline framework for developing advanced and extensible control solutions.
