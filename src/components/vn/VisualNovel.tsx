import { useEffect, useState } from "react";
import { BookOpen, MapPin, Save, Users, X } from "lucide-react";
import { CHAR_META, ENDINGS, LORE, trustLabel } from "@/game/meta";
import { deleteSlot, loadSlots, readSlot, writeSlot, type SaveSlot } from "@/game/save";
import { nodeText, useGame } from "@/game/store";
import { NODES } from "@/game/story";
import type { TrustKey } from "@/game/types";
import { cn } from "@/lib/utils";

const BG: Record<string, string> = {
  threshold: "/bg/threshold.jpg",
  street: "/bg/street.jpg",
  library: "/bg/library.jpg",
  garden: "/bg/garden.jpg",
  heaven: "/bg/threshold.jpg",
  office: "/bg/library.jpg",
  night: "/bg/garden.jpg",
};

const PORTRAIT: Record<string, string> = {
  lucifer: "/portraits/lucifer.jpg",
  elias: "/portraits/elias.jpg",
  dion: "/portraits/dion.jpg",
  lilith: "/portraits/lilith.jpg",
  cain: "/portraits/cain.jpg",
  angel: "/portraits/angel.jpg",
};

export function VisualNovel() {
  const screen = useGame((s) => s.screen);
  const toast = useGame((s) => s.toast);

  useEffect(() => {
    const onHide = () => {
      const g = useGame.getState();
      if (g.screen === "game") writeSlot(0, g.state);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  return (
    <div className="vn-shell">
      {screen === "title" && <Title />}
      {screen === "game" && <Play />}
      {screen === "ending" && <Ending />}
      <Panels />
      {toast && <Toast key={toast.id} text={toast.text} />}
    </div>
  );
}

function Title() {
  const [name, setName] = useState("");
  const start = useGame((s) => s.start);
  const setPanel = useGame((s) => s.setPanel);
  return (
    <div className="vn-title">
      <div className="vn-title-bg" style={{ backgroundImage: "url(/bg/threshold.jpg)" }} />
      <div className="vn-title-veil" />
      <div className="vn-title-inner">
        <p className="vn-kicker">Оригинальная визуальная новелла</p>
        <h1 className="vn-logo">Теория Доброй Вселенной</h1>
        <p className="vn-tag">Глава I — Прибытие</p>
        <p className="vn-epigraph">
          Что происходит, когда вместо греха пытаются увидеть самого человека?
        </p>
        <label className="vn-name">
          <span>Имя души</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="Душа"
            autoComplete="off"
          />
        </label>
        <div className="vn-title-actions">
          <button className="vn-btn vn-btn-primary" type="button" onClick={() => start(name)}>
            Начать
          </button>
          <button className="vn-btn" type="button" onClick={() => setPanel("saves")}>
            Продолжить
          </button>
          <button className="vn-btn" type="button" onClick={() => setPanel("about")}>
            Об игре
          </button>
        </div>
      </div>
    </div>
  );
}

function Play() {
  const state = useGame((s) => s.state);
  const advance = useGame((s) => s.advance);
  const choose = useGame((s) => s.choose);
  const canShow = useGame((s) => s.canShow);
  const setPanel = useGame((s) => s.setPanel);
  const node = NODES[state.node];
  const text = nodeText(state);
  const visibleChoices = node?.choices || [];
  const bg = BG[node?.bg || "threshold"] || BG.threshold;
  const heaven = node?.bg === "heaven";
  const night = node?.bg === "night";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useGame.getState().setPanel(null);
      if ((e.key === "Enter" || e.key === " ") && !node?.choices?.length) {
        e.preventDefault();
        useGame.getState().advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [node?.choices?.length]);

  return (
    <div className={cn("vn-play", heaven && "is-heaven", night && "is-night")}>
      <div className="vn-bg" style={{ backgroundImage: `url(${bg})` }} />
      <div className="vn-bg-veil" />
      <header className="vn-top">
        <div className="vn-loc">
          <MapPin className="size-3.5" strokeWidth={1.75} />
          {state.location}
        </div>
        <nav className="vn-nav">
          <button type="button" onClick={() => setPanel("journal")}>
            <BookOpen className="size-4" /> Журнал
          </button>
          <button type="button" onClick={() => setPanel("chars")}>
            <Users className="size-4" /> Персонажи
          </button>
          <button type="button" onClick={() => setPanel("saves")}>
            <Save className="size-4" /> Сохранения
          </button>
          <button type="button" onClick={() => useGame.getState().toTitle()}>
            Меню
          </button>
        </nav>
      </header>
      <div className="vn-stage">
        {(node?.chars || []).map((id) => (
          <img
            key={id}
            src={PORTRAIT[id]}
            alt=""
            className={cn("vn-sprite", node.speakerId === id && "is-speak")}
          />
        ))}
      </div>
      <div className="vn-box">
        {node?.speaker ? (
          <div className={cn("vn-speaker", node.speakerId && `sp-${node.speakerId}`)}>
            {node.speaker}
          </div>
        ) : null}
        <p className="vn-text">{text}</p>
        {visibleChoices.length ? (
          <div className="vn-choices">
            {visibleChoices.map((c, i) => {
              const ok = canShow(c);
              if (!ok && (c.reqFlag || c.reqFlagNot) && !c.reqTrust) return null;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!ok}
                  className={cn("vn-choice", !ok && "is-locked")}
                  onClick={() => ok && choose(c)}
                >
                  {ok ? interpolateChoice(c.text, state.playerName) : "Ещё слишком рано"}
                </button>
              );
            })}
          </div>
        ) : (
          <button type="button" className="vn-continue" onClick={advance}>
            Продолжить
          </button>
        )}
      </div>
    </div>
  );
}

function interpolateChoice(t: string, name: string) {
  return t.replaceAll("{name}", name || "Душа");
}

function Ending() {
  const key = useGame((s) => s.endingKey);
  const state = useGame((s) => s.state);
  const start = useGame((s) => s.start);
  const end = key ? ENDINGS[key] : null;
  const seen = state.endingsSeen.length;
  return (
    <div className="vn-ending">
      <div className="vn-title-bg" style={{ backgroundImage: "url(/bg/garden.jpg)" }} />
      <div className="vn-title-veil" />
      <div className="vn-ending-inner">
        <p className="vn-kicker">Концовка</p>
        <h2>{end?.title}</h2>
        <p className="vn-ending-desc">{end?.desc(state)}</p>
        <p className="vn-ending-meta">
          Открыто концовок: {seen} из 7 · Повторное прохождение меняет пути
        </p>
        <div className="vn-title-actions">
          <button className="vn-btn vn-btn-primary" type="button" onClick={() => start(state.playerName)}>
            Начать заново
          </button>
          <button className="vn-btn" type="button" onClick={() => useGame.getState().toTitle()}>
            В меню
          </button>
        </div>
      </div>
    </div>
  );
}

function Panels() {
  const panel = useGame((s) => s.panel);
  const setPanel = useGame((s) => s.setPanel);
  if (!panel) return null;
  return (
    <div className="vn-overlay" onClick={() => setPanel(null)}>
      <div className="vn-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="vn-close" onClick={() => setPanel(null)} aria-label="Закрыть">
          <X className="size-5" />
        </button>
        {panel === "journal" && <Journal />}
        {panel === "chars" && <Chars />}
        {panel === "saves" && <Saves />}
        {panel === "about" && <About />}
      </div>
    </div>
  );
}

function Journal() {
  const journal = useGame((s) => s.state.journal);
  return (
    <>
      <h2>Журнал сведений</h2>
      {!journal.length && <p className="vn-muted">Пока пусто. Сведения откроются по мере пути.</p>}
      {journal.map((id) => (
        <article key={id} className="vn-entry">
          <h3>{LORE[id]?.title}</h3>
          <p>{LORE[id]?.text}</p>
        </article>
      ))}
    </>
  );
}

function Chars() {
  const state = useGame((s) => s.state);
  const ids = Object.keys(CHAR_META) as TrustKey[];
  return (
    <>
      <h2>Персонажи</h2>
      <p className="vn-muted">Доверие скрыто за словами. Биографии открываются постепенно.</p>
      {ids.map((id) => {
        const level = state.charsUnlocked[id] || 0;
        const t = state.trust[id];
        const data = CHAR_META[id];
        if (!level && t <= 0) {
          return (
            <article key={id} className="vn-entry vn-char">
              <div className="vn-char-unknown" />
              <div>
                <h3>???</h3>
                <p className="vn-muted">Ещё не встречен.</p>
              </div>
            </article>
          );
        }
        const extra = Object.entries(data.unlocks)
          .filter(([lv]) => Number(lv) <= level)
          .map(([, v]) => v);
        return (
          <article key={id} className="vn-entry vn-char">
            <img src={data.portrait} alt="" />
            <div>
              <h3>{data.name}</h3>
              <p className="vn-char-title">{data.title}</p>
              <p className="vn-trust">
                Отношение: <strong>{trustLabel(t)}</strong>
              </p>
              <p>{data.base}</p>
              {extra.map((x, i) => (
                <p key={i}>{x}</p>
              ))}
            </div>
          </article>
        );
      })}
    </>
  );
}

function Saves() {
  const [slots, setSlots] = useState<SaveSlot[]>(() => loadSlots());
  const screen = useGame((s) => s.screen);
  const refresh = () => setSlots(loadSlots());
  return (
    <>
      <h2>Сохранения</h2>
      <p className="vn-muted">Пять слотов. Автосохранение — в слот 1 при сворачивании.</p>
      {slots.map((s, i) => (
        <div key={i} className="vn-slot">
          <div>
            <strong>Слот {i + 1}</strong>
            {s ? (
              <p>
                {s.playerName} · {s.location}
                <br />
                {new Date(s.time).toLocaleString("ru")}
              </p>
            ) : (
              <p className="vn-muted">Пусто</p>
            )}
          </div>
          <div className="vn-slot-actions">
            {screen === "game" && (
              <button
                type="button"
                className="vn-btn"
                onClick={() => {
                  writeSlot(i, useGame.getState().state);
                  refresh();
                }}
              >
                Сохранить
              </button>
            )}
            {s && (
              <button
                type="button"
                className="vn-btn vn-btn-primary"
                onClick={() => {
                  const st = readSlot(i);
                  if (st) useGame.getState().loadState(st);
                }}
              >
                Загрузить
              </button>
            )}
            {s && (
              <button
                type="button"
                className="vn-btn"
                onClick={() => {
                  deleteSlot(i);
                  refresh();
                }}
              >
                Удалить
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function About() {
  return (
    <>
      <h2>Об игре</h2>
      <p>
        «Теория Доброй Вселенной» — оригинальная теологическая фэнтезийная визуальная новелла. Ад здесь —
        общество душ: власть, память, вина, дружба, семья и возможность измениться.
      </p>
      <p>
        Главная тема: человек не равен своему делу. Небесная канцелярия ставит печати. Верхний Ад спорит с
        ними.
      </p>
      <p className="vn-muted">
        Выборы меняют скрытое доверие. Некоторые сцены открываются только если вас уже не боятся. Семь
        концовок. Повторные прохождения — часть замысла.
      </p>
    </>
  );
}

function Toast({ text }: { text: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 2800);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return <div className="vn-toast">{text}</div>;
}


