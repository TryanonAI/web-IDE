import { useEffect, useRef } from 'react';

import {
  WebSocketSession,
  createPreview,
  Preview,
} from '@codesandbox/sdk/browser';
// import '../node_modules/@xterm/xterm/css/xterm.css';

import { useState } from 'react';

export function PreviewComponent({ session }: { session: WebSocketSession }) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // const terminalRef = useTerminal(session, terminalContainerRef);
  const previewRef = useRef<Preview<{ type: 'ping' }, { type: 'pong' }>>(null);
  const [messages, setMessages] = useState<unknown[]>([]);

  useEffect(() => {
    if (previewContainerRef.current) {
      const port = session.ports.get(5173);

      if (!port) {
        return;
      }

      const preview = createPreview<{ type: 'ping' }, { type: 'pong' }>(
        session.hosts.getUrl(port.port)
      );

      previewRef.current = preview;
      preview.iframe.style.height = '100%';

      // @ts-expect-error ignore
      preview.onStatusChange((status) => {
        if (status === 'CONNECTED') {
          preview.injectAndInvoke(function test({ previewProtocol }) {
            previewProtocol.addListener('ping', () => {
              previewProtocol.sendMessage({ type: 'pong' });
            });
          }, {});
        }
      });

      preview.onMessage((msg) => {
        setMessages((prev) => [msg, ...prev]);
      });

      previewContainerRef.current.append(preview.iframe);
    }
  }, [session]);

  return (
    <>
      <div className="flex flex-row gap-8 items-center w-full max-w-2xl h-96 mt-1 rounded-lg shadow-lg overflow-hidden border-2 transition-colors duration-200 bg-white border-slate-200 p-4">
        <div
          ref={previewContainerRef}
          className="w-full h-full bg-white rounded-lg border border-slate-300 overflow-hidden"
          style={{ minHeight: 240, height: '100%' }}
        />
      </div>
      {/* Message log below preview */}
      <div className="w-full max-w-2xl mt-4 bg-slate-50 rounded-lg border border-slate-200 p-4 font-mono text-sm text-slate-800 max-h-40 overflow-y-auto">
        <div className="font-bold mb-2 text-slate-600">
          Messages from Preview:
        </div>
        {messages.length === 0 ? (
          <div className="opacity-50">No messages received yet.</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="mb-1 whitespace-pre-wrap break-all">
              {typeof msg === 'object' ? JSON.stringify(msg) : String(msg)}
            </div>
          ))
        )}
      </div>
    </>
  );
}
