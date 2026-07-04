import { Fragment, ReactNode } from 'react';

/** Renderer minimale per il sottoinsieme markdown usato nelle guide rapide bundlate (niente dipendenza esterna). */

function renderInline(text: string): ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-zinc-800 px-1 py-0.5 rounded text-xs">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
    });
}

function renderTable(rows: string[][], key: number): ReactNode {
    const [header, , ...body] = rows;
    return (
        <div key={key} className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="border-b border-zinc-700">
                        {header.map((cell, i) => (
                            <th key={i} className="text-left py-1.5 px-2 text-zinc-300 font-semibold">{renderInline(cell)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {body.map((row, ri) => (
                        <tr key={ri} className="border-b border-zinc-800/60">
                            {row.map((cell, ci) => (
                                <td key={ci} className="py-1.5 px-2 text-zinc-400">{renderInline(cell)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function splitTableRow(line: string): string[] {
    return line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

export const MarkdownLite = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    const blocks: ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (/^\s*$/.test(line)) { i++; continue; }

        if (/^---\s*$/.test(line)) {
            blocks.push(<hr key={i} className="border-zinc-800 my-4" />);
            i++;
            continue;
        }

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            const level = heading[1].length;
            const text = renderInline(heading[2]);
            const className = level === 1
                ? 'text-lg font-bold text-white mt-4 mb-2'
                : 'text-sm font-bold text-cyan-400 mt-4 mb-1.5';
            blocks.push(level === 1 ? <h1 key={i} className={className}>{text}</h1> : <h2 key={i} className={className}>{text}</h2>);
            i++;
            continue;
        }

        if (/^\|/.test(line)) {
            const rows: string[][] = [];
            while (i < lines.length && /^\|/.test(lines[i])) {
                rows.push(splitTableRow(lines[i]));
                i++;
            }
            blocks.push(renderTable(rows, i));
            continue;
        }

        if (/^-\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^-\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^-\s+/, ''));
                i++;
            }
            blocks.push(
                <ul key={i} className="list-disc list-inside space-y-1 my-2 text-zinc-400">
                    {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
                </ul>
            );
            continue;
        }

        if (/^\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s+/, ''));
                i++;
            }
            blocks.push(
                <ol key={i} className="list-decimal list-inside space-y-1 my-2 text-zinc-400">
                    {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
                </ol>
            );
            continue;
        }

        if (/^\*.*\*$/.test(line.trim())) {
            blocks.push(<p key={i} className="italic text-zinc-500 text-xs mt-4">{renderInline(line.trim())}</p>);
            i++;
            continue;
        }

        blocks.push(<p key={i} className="text-sm text-zinc-400 leading-relaxed my-2">{renderInline(line)}</p>);
        i++;
    }

    return <div>{blocks}</div>;
};
