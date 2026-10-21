import React from 'react';
import {
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Lightbulb,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface FormattedCoachMessageProps {
  content: string;
}

interface ParsedBlock {
  type: 'heading' | 'study_block' | 'action' | 'numbered_list' | 'bullet_list' | 'tip' | 'paragraph';
  headingText?: string;
  blockTitle?: string;
  timeInfo?: string;
  actionText?: string;
  description?: string;
  items?: string[];
  text?: string;
}

export const FormattedCoachMessage: React.FC<FormattedCoachMessageProps> = ({ content }) => {
  // Helper to render inline formatting: **bold**, *italic*, `code`, and clean up stray asterisks
  const renderInline = (text: string): React.ReactNode => {
    if (!text) return null;
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const plain = text.substring(lastIndex, match.index).replace(/\*+/g, '');
        if (plain) parts.push(plain);
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        parts.push(
          <strong key={match.index} className="font-['Outfit'] font-bold text-slate-900">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        parts.push(
          <em key={match.index} className="italic text-slate-800 font-medium">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 font-mono text-xs text-emerald-900 font-semibold"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      const trailing = text.substring(lastIndex).replace(/\*+/g, '');
      if (trailing) parts.push(trailing);
    }

    return parts.length > 0 ? parts : text.replace(/\*+/g, '');
  };

  // Structured parser to turn markdown into semantic UI blocks
  const parseContent = (raw: string): ParsedBlock[] => {
    // 1. Normalize line breaks and Gemini's malformed markdown
    const normalized = raw
      .replace(/\r\n/g, '\n')
      // Fix broken action tags like "* **Action:*" or "**Action:*" with trailing single asterisk
      .replace(/\*?\s*\*\*Action:\*?\s*/gi, '**Action:** ')
      .replace(/\*?\s*Action:\s*/gi, '**Action:** ')
      // Fix bullets in front of study blocks
      .replace(/^\*\s*\*\*(Block|Phase|Session|Step)/gim, '**$1');

    const lines = normalized.split('\n');
    const blocks: ParsedBlock[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      // 1. Heading (### or ## or #)
      if (trimmed.startsWith('#')) {
        const headingText = trimmed.replace(/^#+\s*/, '').replace(/\*+/g, '');
        blocks.push({ type: 'heading', headingText });
        i++;
        continue;
      }

      // 2. Study Block Header (e.g. "**Block 1: Kickoff (25 minutes focus + 5 minutes break)**" or "* **Block 2:...")
      if (
        /^\*?\s*\*\*(Block|Phase|Session|Step)\s*\d+.*?\*\*/i.test(trimmed) ||
        /^\*\*(Block|Phase|Session|Step)\s*\d+/i.test(trimmed) ||
        /^(Block|Phase|Session|Step)\s*\d+:/i.test(trimmed)
      ) {
        // Extract timing inside parentheses e.g. "(25 minutes focus + 5 minutes break)"
        let timeInfo = '';
        const timeMatch = trimmed.match(/\(([^)]*(?:min|break|focus|wrap-up|hour)[^)]*)\)/i);
        if (timeMatch) {
          timeInfo = timeMatch[1].trim();
        }

        // Clean title: remove wrapping asterisks, bullets, and timing in parentheses
        let blockTitle = trimmed
          .replace(/^\*\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/\([^)]*(?:min|break|focus|wrap-up|hour)[^)]*\)/i, '')
          .replace(/:$/, '')
          .trim();

        // Lookahead: check if subsequent lines contain description or an attached Action
        let actionText: string | undefined;
        let desc: string | undefined;
        let nextIdx = i + 1;

        while (nextIdx < lines.length) {
          const nextTrimmed = lines[nextIdx].trim();
          if (!nextTrimmed) {
            nextIdx++;
            continue;
          }

          // Check if next line is Action
          if (
            /^\*?\s*\*\*Action:\*\*/i.test(nextTrimmed) ||
            /^\*?\s*Action:/i.test(nextTrimmed)
          ) {
            actionText = nextTrimmed
              .replace(/^\*\s*/, '')
              .replace(/^\*\*Action:\*\*\s*/i, '')
              .replace(/^Action:\s*/i, '')
              .replace(/^\*+\s*/, '')
              .trim();
            nextIdx++;
            break; // finished this block
          } else if (
            /^\*?\s*\*\*(Block|Phase|Session|Step)/i.test(nextTrimmed) ||
            /^(Block|Phase|Session|Step)\s*\d+/i.test(nextTrimmed) ||
            nextTrimmed.startsWith('#') ||
            /^\d+\./.test(nextTrimmed)
          ) {
            // Reached next block/heading/list, stop lookahead
            break;
          } else {
            // Regular description text for the block
            const cleanedDescLine = nextTrimmed.replace(/^\*\s*/, '');
            desc = desc ? `${desc} ${cleanedDescLine}` : cleanedDescLine;
            nextIdx++;
          }
        }

        blocks.push({
          type: 'study_block',
          blockTitle,
          timeInfo,
          actionText,
          description: desc,
        });

        i = nextIdx;
        continue;
      }

      // 3. Standalone Action item (if not attached to a block)
      if (/^\*?\s*\*\*Action:\*\*/i.test(trimmed) || /^\*?\s*Action:/i.test(trimmed)) {
        const actionText = trimmed
          .replace(/^\*\s*/, '')
          .replace(/^\*\*Action:\*\*\s*/i, '')
          .replace(/^Action:\s*/i, '')
          .trim();
        blocks.push({ type: 'action', actionText });
        i++;
        continue;
      }

      // 4. Tip or Pro-Tip Callout
      if (/^>\s*/.test(trimmed) || /^(Tip|Pro-tip|Note|Coach Tip):/i.test(trimmed)) {
        const tipText = trimmed
          .replace(/^>\s*/, '')
          .replace(/^(Tip|Pro-tip|Note|Coach Tip):\s*/i, '')
          .trim();
        blocks.push({ type: 'tip', text: tipText });
        i++;
        continue;
      }

      // 5. Numbered List (1. ...)
      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length) {
          const currTrimmed = lines[i].trim();
          const match = currTrimmed.match(/^\d+\.\s+(.*)/);
          if (match) {
            items.push(match[1]);
            i++;
          } else if (!currTrimmed) {
            if (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trim())) {
              i++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        blocks.push({ type: 'numbered_list', items });
        continue;
      }

      // 6. Bullet List (* or -)
      if (/^(\*|-)\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < lines.length) {
          const currTrimmed = lines[i].trim();
          const match = currTrimmed.match(/^(\*|-)\s+(.*)/);
          if (match) {
            items.push(match[2]);
            i++;
          } else if (!currTrimmed) {
            if (i + 1 < lines.length && /^(\*|-)\s+/.test(lines[i + 1].trim())) {
              i++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        blocks.push({ type: 'bullet_list', items });
        continue;
      }

      // 7. Regular paragraph
      blocks.push({ type: 'paragraph', text: trimmed });
      i++;
    }

    return blocks;
  };

  const parsedBlocks = parseContent(content);

  return (
    <div className="space-y-3 font-['Plus_Jakarta_Sans',sans-serif] text-[13.5px] sm:text-[14px] text-slate-700 leading-relaxed">
      {parsedBlocks.map((block, idx) => {
        // 1. Heading
        if (block.type === 'heading') {
          return (
            <div
              key={idx}
              className="pt-3.5 pb-1.5 border-b border-emerald-100/90 flex items-center gap-2 mt-2"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-['Outfit'] font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                {renderInline(block.headingText || '')}
              </h4>
            </div>
          );
        }

        // 2. Study Block (Schedule Card)
        if (block.type === 'study_block') {
          return (
            <div
              key={idx}
              className="my-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-emerald-300"
            >
              {/* Header row with Title and Timing Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-['Outfit'] font-bold text-slate-900 text-sm sm:text-[14.5px] tracking-tight">
                    {block.blockTitle}
                  </span>
                </div>
                {block.timeInfo && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 font-mono text-[11px] font-bold tracking-wide border border-emerald-200 shadow-2xs">
                    {block.timeInfo}
                  </span>
                )}
              </div>

              {/* Description if present */}
              {block.description && (
                <p className="mt-2 text-xs sm:text-[13px] text-slate-600 font-medium leading-relaxed">
                  {renderInline(block.description)}
                </p>
              )}

              {/* Action item inside block */}
              {block.actionText && (
                <div className="mt-2.5 flex items-start gap-2.5 bg-white/95 border border-emerald-200/80 rounded-xl p-2.5 sm:p-3 text-xs sm:text-[13px] shadow-2xs">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 leading-relaxed text-slate-700 font-medium">
                    <span className="font-['Outfit'] font-extrabold text-emerald-900 mr-1.5 uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200/50">
                      Action
                    </span>
                    {renderInline(block.actionText)}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // 3. Standalone Action Callout
        if (block.type === 'action') {
          return (
            <div
              key={idx}
              className="my-2.5 flex items-start gap-3 bg-gradient-to-r from-emerald-50/80 to-teal-50/30 border-l-4 border-emerald-500 rounded-r-2xl p-3 text-xs sm:text-[13.5px] shadow-2xs"
            >
              <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 leading-relaxed text-slate-700 font-medium">
                <span className="font-['Outfit'] font-extrabold text-emerald-900 mr-2 uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200/50">
                  Action Step
                </span>
                {renderInline(block.actionText || '')}
              </div>
            </div>
          );
        }

        // 4. Tip or Coach Pro-Tip Callout
        if (block.type === 'tip') {
          return (
            <div
              key={idx}
              className="my-3 flex items-start gap-3 bg-amber-50/80 border border-amber-200 rounded-2xl p-3 sm:p-3.5 text-xs sm:text-[13px] text-amber-950 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 leading-relaxed">
                <span className="font-['Outfit'] font-extrabold uppercase text-[10px] tracking-wider text-amber-900 block mb-0.5">
                  Coach Pro Tip
                </span>
                <span className="font-medium text-amber-950">{renderInline(block.text || '')}</span>
              </div>
            </div>
          );
        }

        // 5. Numbered List (Actionable sequence)
        if (block.type === 'numbered_list') {
          return (
            <div key={idx} className="my-2.5 space-y-2">
              {block.items?.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-['Outfit'] text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {itemIdx + 1}
                  </span>
                  <div className="flex-1 text-xs sm:text-[13.5px] leading-relaxed text-slate-700 font-medium pt-0.5">
                    {renderInline(item)}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // 6. Bullet List
        if (block.type === 'bullet_list') {
          return (
            <div key={idx} className="my-2 space-y-1.5 pl-1">
              {block.items?.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-start gap-2.5 text-xs sm:text-[13.5px] text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  <div className="flex-1 leading-relaxed font-medium">
                    {renderInline(item)}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // 7. Regular text paragraph
        return (
          <p key={idx} className="my-1.5 text-xs sm:text-[13.5px] leading-relaxed font-medium text-slate-700">
            {renderInline(block.text || '')}
          </p>
        );
      })}
    </div>
  );
};
