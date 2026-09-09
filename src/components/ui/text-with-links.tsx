const URL_SPLIT_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const URL_TEST_RE = /^(https?:\/\/|www\.)/i;

function splitUrlToken(token: string) {
  const match = token.match(/^((?:https?:\/\/|www\.)[^\s]+?)([.,;:!?)]+)?$/i);
  if (!match) return null;
  const url = match[1];
  const trailing = match[2] ?? "";
  const href = url.startsWith("http") ? url : `https://${url}`;
  return { href, display: url, trailing };
}

export function TextWithLinks({ text }: { text: string }) {
  const parts = text.split(URL_SPLIT_RE);

  return (
    <>
      {parts.map((part, i) => {
        if (!URL_TEST_RE.test(part)) return part;
        const parsed = splitUrlToken(part);
        if (!parsed) return part;
        return (
          <span key={i}>
            <a
              href={parsed.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky underline underline-offset-2 break-all hover:text-sky/80"
            >
              {parsed.display}
            </a>
            {parsed.trailing}
          </span>
        );
      })}
    </>
  );
}
