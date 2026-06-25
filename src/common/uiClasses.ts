export const appShellClass =
  "mx-auto min-h-screen w-full max-w-7xl bg-[#f7f4ff] px-[18px] text-slate-950 antialiased dark:bg-[#121020] dark:text-violet-50 [font-family:'Avenir_Next','Trebuchet_MS',Verdana,sans-serif]";
export const mastheadClass = "flex justify-end py-2";
export const activeScreenClass = "animate-[app-enter_260ms_ease-out]";
export const mastheadTitleClass = "m-0 text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[1.02]";
export const kickerClass = "mb-2 mt-0 text-xs font-extrabold uppercase tracking-normal text-violet-600 dark:text-emerald-300";
export const panelClass =
  "rounded-lg border border-violet-200/90 bg-white/88 p-4 shadow-[0_16px_38px_rgba(76,58,139,0.10)] ring-1 ring-white/80 transition duration-200 dark:border-violet-400/25 dark:bg-[#1a1730]/92 dark:shadow-[0_18px_44px_rgba(0,0,0,0.28)] dark:ring-white/5";
export const setupGridClass = "grid gap-3.5 md:grid-cols-3";
export const startBandClass =
  "col-span-full flex flex-col items-stretch justify-between gap-3 rounded-lg border border-violet-200 bg-[linear-gradient(135deg,#ffffff_0%,#f2edff_48%,#e9fbf3_100%)] p-4 shadow-[0_18px_44px_rgba(76,58,139,0.13)] ring-1 ring-white/80 transition duration-200 dark:border-violet-400/25 dark:bg-[linear-gradient(135deg,#1b1732_0%,#151f2d_52%,#10251d_100%)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.30)] dark:ring-white/5 md:flex-row md:items-center";
export const actionRowClass = "flex flex-wrap gap-2.5";
export const buttonBaseClass =
  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md border border-violet-200 px-4 py-2.5 font-extrabold text-slate-950 shadow-[0_8px_20px_rgba(76,58,139,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_12px_26px_rgba(76,58,139,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ff] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45 dark:border-violet-400/30 dark:text-violet-50 dark:shadow-[0_10px_28px_rgba(0,0,0,0.22)] dark:focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-[#121020]";
export const primaryActionClass = `${buttonBaseClass} border-emerald-500 bg-emerald-500 text-white hover:border-emerald-400 hover:bg-emerald-400 dark:border-emerald-400 dark:bg-emerald-500 dark:text-[#07130f]`;
export const compactPrimaryActionClass = `${primaryActionClass} min-w-0 px-2 sm:px-4`;
export const secondaryActionClass = `${buttonBaseClass} bg-white/90 text-violet-900 hover:bg-violet-50 dark:bg-[#211c3c] dark:text-violet-50 dark:hover:bg-[#2a2350]`;
export const compactSecondaryActionClass = `${secondaryActionClass} min-w-0 px-2 sm:px-4`;
export const themeToggleClass =
  "inline-grid size-5 place-items-center p-0 text-violet-900 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:text-violet-50";
export const fieldClass = "my-2.5 grid gap-1.5 font-extrabold";
export const checkRowClass = "my-2.5 grid grid-cols-[auto_1fr] items-center gap-1.5 font-extrabold";
export const inputClass =
  "min-h-[42px] w-full rounded-md border border-violet-200 bg-white/95 px-2.5 py-2 text-slate-950 shadow-inner shadow-violet-100/40 transition duration-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-violet-400/30 dark:bg-[#12182a] dark:text-violet-50 dark:shadow-none";
export const finePrintClass = "mt-2.5 text-slate-600 dark:text-violet-200/76";
export const currentBidClass = finePrintClass;
export const biddingLayoutClass = "grid gap-3.5 md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]";
export const modeButtonClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-violet-200 bg-white/85 px-3 py-2 font-extrabold text-violet-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 aria-pressed:border-emerald-400 aria-pressed:bg-emerald-50 aria-pressed:text-emerald-800 dark:border-violet-400/25 dark:bg-[#211c3c] dark:text-violet-50 dark:hover:bg-[#2a2350] dark:aria-pressed:border-emerald-300 dark:aria-pressed:bg-emerald-400/15 dark:aria-pressed:text-emerald-200";
export const checkboxClass = "size-4 accent-emerald-500 transition duration-200";
export const propertyStageClass =
  "grid min-h-[260px] content-center gap-3 rounded-lg border border-violet-200 bg-[linear-gradient(145deg,#ffffff_0%,#f3efff_52%,#ecfff6_100%)] p-4 shadow-[0_18px_44px_rgba(76,58,139,0.13)] ring-1 ring-white/80 dark:border-violet-400/25 dark:bg-[linear-gradient(145deg,#19172c_0%,#151b2d_52%,#10251d_100%)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.30)] dark:ring-white/5 md:min-h-[420px]";
export const propertyCardClass =
  "mx-auto w-full max-w-[420px] animate-[property-reveal_360ms_ease-out] overflow-hidden rounded-xl border border-violet-300 bg-white text-slate-950 shadow-[0_18px_36px_rgba(76,58,139,0.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_46px_rgba(76,58,139,0.20)] dark:border-violet-400/35 dark:bg-[#f8fbff] dark:text-slate-950";
export const propertyBandClass =
  "grid min-h-[72px] place-items-center border-b border-violet-200 bg-(--property-color) font-black uppercase text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.45)]";
export const propertyBodyClass = "grid gap-2.5 p-4 text-center";
export const propertyTitleClass = "text-[clamp(1.3rem,4vw,2rem)] uppercase text-[#1b1830]";
export const countdownClassBase =
  "mx-auto mt-1 w-full max-w-[420px] rounded-lg border border-emerald-200 bg-white/86 p-3 text-center text-3xl font-black tracking-[0.02em] text-emerald-600 shadow-[0_12px_28px_rgba(16,185,129,0.12)] transition duration-200 dark:border-emerald-400/30 dark:bg-[#182437]/90 dark:text-emerald-300";
