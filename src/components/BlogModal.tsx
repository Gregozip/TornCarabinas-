import React from "react";
import { BlogPost } from "../types";
import { X, Calendar, User, Clock, ArrowLeft, Tag } from "lucide-react";

interface BlogModalProps {
  post: BlogPost;
  onClose: () => void;
}

export const BlogModal: React.FC<BlogModalProps> = ({ post, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0A] shadow-2xl transition-all max-h-[92vh] flex flex-col">
        
        {/* Header toolbar */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/60 sticky top-0 z-10 backdrop-blur-xs">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
          >
            <ArrowLeft size={14} />
            <span>Voltar para o Blog</span>
          </button>
          
          <button
            onClick={onClose}
            className="rounded-full bg-black/80 p-1.5 text-zinc-400 border border-white/10 transition-colors hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-6 md:p-10 flex-1">
          {/* Post Header */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Category tag */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-full font-mono">
              <Tag size={10} />
              {post.category}
            </span>

            <h1 className="text-xl md:text-3xl font-extrabold uppercase tracking-tight text-white font-display leading-tight">
              {post.title}
            </h1>

            {/* Meta statistics */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 py-2 border-y border-white/10 text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-zinc-500" />
                <span>Por: <strong className="text-zinc-300 font-medium">{post.author}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-zinc-500" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-zinc-500" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="my-8 aspect-video w-full overflow-hidden rounded border border-white/10 bg-black shadow-lg max-h-[380px]">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="h-full w-full object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Article markdown / body */}
          <article className="prose prose-invert max-w-3xl mx-auto text-sm md:text-base text-zinc-300 leading-relaxed space-y-6">
            {post.content.split("\n\n").map((paragraph, idx) => {
              // Simple markdown headers preview helper
              if (paragraph.startsWith("### ")) {
                return (
                  <h3 key={idx} className="text-base md:text-lg font-bold font-display uppercase tracking-wider text-white pt-4 flex items-center gap-2">
                    <span className="h-3.5 w-1 bg-red-600 rounded-sm inline-block" />
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("* ") || paragraph.startsWith("- ")) {
                const listItems = paragraph.split("\n");
                return (
                  <ul key={idx} className="list-disc list-inside space-y-2 pl-4 text-zinc-400 text-xs font-sans md:text-sm">
                    {listItems.map((item, itemIdx) => (
                      <li key={itemIdx}>{item.replace(/^(\*\s|-\s)/, "")}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} className="whitespace-pre-wrap text-zinc-300 text-xs md:text-sm leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </article>
        </div>
      </div>
    </div>
  );
};
