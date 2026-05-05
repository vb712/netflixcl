/* =========================================================================
   Netflix-inspired cinematic player — controller
   - Landing : profile pick → loader → redirect to player.html?p=<season>
   - Player  : per-season slideshow with crossfade/Ken-Burns + audio
   ========================================================================= */
(() => {
  "use strict";

  /* -----------------------------------------------------------------------
     SEASON CATALOG
     Maps profile → folder, audio, ordered media list.
     Filenames are the raw on-disk names; we URL-encode each segment.
     ----------------------------------------------------------------------- */
  const SEASONS = {
    summer: {
      title: "Summer",
      tagline: "Romantic. Warm. Sun-soaked.",
      folder: "edit1",
      bpm: 128,                 // Beauty and a Beat — 128 BPM
      beatsPerSlide: 8,         // 2 bars per slide — slower, breathable
      slideMs: 3750,            // = 60000/128 * 8
      transitionMs: 900,
      beat: false,
      audio: "Justin Bieber - Beauty And A Beat (Official Music Video) ft. Nicki Minaj.mp3",
      audioStartSec: 43,        // skip into the chorus
      thumb: "IMG_9249.JPG.jpeg",
      media: [
        // Vevo intro — 6s cap, 1.5× speed. Tighter than before so it
        // can't run on / appear to repeat.
        { type: "video", file: "IMG_9234.mp4", durationMs: 6000, playbackRate: 1.5 },
        // Single anchor original + interleaved nature (WhatsApp 9.52.48 series)
        // and Spring portraits.
        { type: "image", file: "IMG_9249.JPG.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (5).jpeg" },
        { type: "image", folder: "edit4", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (6).jpeg" },
        { type: "image", folder: "edit4", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (7).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.54 PM(2).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (8).jpeg" },
        // Mid-reel video — 7s cap, 1.6× speed. Longer than before.
        { type: "video", file: "WhatsApp Video 2026-05-05 at 9.53.04 PM.mp4", durationMs: 7000, playbackRate: 1.6 },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.54 PM(3).jpeg" } // closing nature
      ]
    },

    fall: {
      title: "Fall",
      tagline: "Soft. Golden. Cozy.",
      folder: "edit2",
      bpm: 86,
      beatsPerSlide: 1,           // post-drop: 1 cut per beat
      slideMs: 698,               // = 60000/86
      transitionMs: 300,
      beat: false,
      // Phased tempo: dreamy intro for the first 6s of audio, then the
      // beat-driven fast cuts kick in. Each entry says "while
      // audio.currentTime < until, override beatsPerSlide".
      tempoPhases: [
        { until: 6, beatsPerSlide: 4 } // intro: 1 cut every 4 beats (~2.8s)
      ],
      audio: "Jenna Ortega edit moonlight edit audio #jennaortega.mp3",
      thumb: "WhatsApp Image 2026-05-05 at 9.52.55 PM.jpeg",
      media: [
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.55 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.54 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.54 PM(1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.57 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.58 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.58 PM(1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.58 PM(2).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.59 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.03 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.03 PM(1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.04 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.04 PM(1).jpeg" }
      ]
    },

    winter: {
      title: "Winter",
      tagline: "Dark. Hot. High contrast.",
      folder: "edit3",
      bpm: 110,
      beatsPerSlide: 3,
      slideMs: 1636,
      transitionMs: 220,
      beat: false,
      audio: "Madison beer Edit One of the girls - The Weekend. #madisonbeer #oneofthegirls #theweeknd #edit.mp3",
      thumb: "WhatsApp Image 2026-05-05 at 9.53.00 PM(1).jpeg",
      media: [
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.56 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.52 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.52 PM(2).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.59 PM(1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.00 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.00 PM(1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.00 PM(2).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.01 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.01 PM(1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.01 PM(2).jpeg" }
      ]
    },

    spring: {
      title: "Spring",
      tagline: "Fast. Energetic. Beat-driven.",
      folder: "edit4",
      bpm: 155,
      beatsPerSlide: 2,
      slideMs: 774,
      transitionMs: 100,
      beat: true,
      audio: "Want this Velocity tutorial #capcut #edit #capcuttutorial #fyp #velocity #velocityedit.mp3",
      thumb: "WhatsApp Image 2026-05-05 at 9.53.02 PM.jpeg",
      media: [
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.02 PM.jpeg" },   // new opener
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM.jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (1).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (2).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (3).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.52.48 PM (4).jpeg" },
        { type: "image", file: "WhatsApp Image 2026-05-05 at 9.53.02 PM(1).jpeg" }
      ]
    }
  };

  const SEASON_ORDER = ["summer", "fall", "winter", "spring"];

  /* Build a usable URL for an asset that may contain spaces, #, parens. */
  const assetUrl = (folder, file) =>
    `${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;

  /* -----------------------------------------------------------------------
     ROUTING — dispatch by body[data-page]
     ----------------------------------------------------------------------- */
  const page = document.body.dataset.page;
  if (page === "landing") initLanding();
  if (page === "player")  initPlayer();

  /* =======================================================================
     LANDING
     ======================================================================= */
  function initLanding() {
    const list   = document.getElementById("profiles");
    const loader = document.getElementById("loader");
    const main   = document.querySelector(".landing");
    const splash = document.getElementById("splash");

    // Netflix logo splash — plays once on page open, then fades out.
    if (splash) {
      const dismiss = () => {
        if (splash.classList.contains("is-done")) return;
        splash.classList.add("is-done");
        setTimeout(() => splash.remove(), 600);
      };
      splash.addEventListener("ended", dismiss, { once: true });
      splash.addEventListener("error", dismiss, { once: true });
      // Hard cap in case the video stalls or codec is unsupported.
      setTimeout(dismiss, 6000);
    }

    // Render profile cards
    const frag = document.createDocumentFragment();
    SEASON_ORDER.forEach((key) => {
      const s = SEASONS[key];
      const li = document.createElement("li");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "profile";
      btn.dataset.season = key;
      btn.setAttribute("aria-label", `${s.title} profile`);

      const thumb = document.createElement("span");
      thumb.className = "profile__thumb";
      thumb.style.backgroundImage = `url("${assetUrl(s.folder, s.thumb)}")`;

      const name = document.createElement("span");
      name.className = "profile__name";
      name.textContent = s.title;

      btn.append(thumb, name);
      li.append(btn);
      frag.append(li);
    });
    list.append(frag);

    // Click → cinematic transition → loader → redirect
    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".profile");
      if (!btn) return;
      handlePick(btn);
    });

    function handlePick(btn) {
      const season = btn.dataset.season;
      if (!season || main.classList.contains("is-leaving")) return;

      btn.classList.add("is-selected");
      main.classList.add("is-leaving");

      // Activate loader once card has zoomed forward (~700ms,
      // matching the .profile.is-selected animation length) so the
      // landing fades to black cleanly before the N intro begins.
      setTimeout(() => {
        loader.classList.add("is-active");
        loader.setAttribute("aria-hidden", "false");
      }, 680);

      // Loader runs for ~3.3s after activation (3.5s CSS animation
      // minus a small buffer). Trigger the white→black handoff just
      // after the flash peaks so the redirect feels seamless.
      setTimeout(() => {
        loader.classList.add("is-fading");
        setTimeout(() => {
          window.location.href = `player.html?p=${encodeURIComponent(season)}`;
        }, 80);
      }, 680 + 3200);
    }
  }

  /* =======================================================================
     PLAYER
     ======================================================================= */
  function initPlayer() {
    const params  = new URLSearchParams(window.location.search);
    const key     = (params.get("p") || "summer").toLowerCase();
    const season  = SEASONS[key] || SEASONS.summer;

    document.body.dataset.season = key;

    // Wire up DOM refs
    const player    = document.getElementById("player");
    const stage     = document.getElementById("stage");
    const titleEl   = document.getElementById("title");
    const playBtn   = document.getElementById("play");
    const chrome    = document.getElementById("chrome");
    const pauseBtn  = document.getElementById("pause");
    const muteBtn   = document.getElementById("mute");
    const seekBack  = document.getElementById("seek-back");
    const seekFwd   = document.getElementById("seek-fwd");
    const ptrack    = document.getElementById("ptrack");
    const pfill     = document.getElementById("pfill");
    const pthumb    = document.getElementById("pthumb");
    const ptime     = document.getElementById("ptime");
    const audio     = document.getElementById("audio");
    const flash     = document.getElementById("flash");
    const nextBtn   = document.getElementById("next-ep");
    const epListBtn = document.getElementById("ep-list");
    const epAudioBtn= document.getElementById("ep-audio");
    const drawer    = document.getElementById("drawer");
    const drawerList= document.getElementById("drawer-list");
    const drawerClose = document.getElementById("drawer-close");
    const castBtn   = document.getElementById("cast");
    const fsBtn     = document.getElementById("fullscreen");
    const beatGlow  = document.getElementById("beatglow");

    // Title in Netflix-style "S1:E# — NAME"
    const epIdx = SEASON_ORDER.indexOf(key) + 1;
    titleEl.innerHTML = `<span class="ep">S1:E${epIdx}</span>${season.title}`;
    document.title = `Netflix — ${season.title}`;

    // Set per-slide CSS variable so animations sync to season pace
    document.documentElement.style.setProperty("--slide-duration", `${season.slideMs}ms`);

    // Build slides up-front. Images use a two-layer pattern: a blurred
    // backdrop covers the viewport, and a contained foreground keeps the
    // native aspect (so portrait phone shots don't distort on landscape
    // monitors). On mobile the backdrop is hidden via CSS and the
    // foreground simply switches to object-fit: cover.
    const slides = season.media.map((m, i) => {
      const el = document.createElement("div");
      el.className = "slide";
      // Per-media `folder` override lets a season pull individual assets
      // from a different edit folder without physically copying files.
      const url = assetUrl(m.folder || season.folder, m.file);
      const eager = i < 2;

      if (m.type === "video") {
        const v = document.createElement("video");
        v.src = url;
        v.muted = true;          // muted required for autoplay
        v.playsInline = true;
        v.loop = false;
        v.preload = "auto";
        if (m.playbackRate) v.defaultPlaybackRate = m.playbackRate;
        v.addEventListener("error", () => {
          el.dataset.broken = "true";
          console.warn("[player] video failed:", m.file, v.error);
        });
        el.append(v);
        el._video = v;
        el._duration = m.durationMs || 8000;
        el._playbackRate = m.playbackRate || 1;
      } else {
        const bg = document.createElement("img");
        bg.src = url;
        bg.alt = "";
        bg.className = "slide__bg";
        bg.setAttribute("aria-hidden", "true");
        bg.draggable = false;
        bg.loading = eager ? "eager" : "lazy";
        bg.decoding = "async";

        const fg = document.createElement("img");
        fg.src = url;
        fg.alt = "";
        fg.className = "slide__fg";
        fg.draggable = false;
        fg.loading = eager ? "eager" : "lazy";
        fg.decoding = "async";

        el.append(bg, fg);
      }

      stage.append(el);
      return el;
    });

    // Audio
    audio.src = assetUrl(season.folder, season.audio);
    audio.loop = false;          // No loop — when the song ends we
                                 // auto-advance to the next episode.
    audio.volume = 0;

    // Skip to a per-season cue point (e.g. into the drop, chorus, etc.)
    const startSec = Number(season.audioStartSec) || 0;
    if (startSec > 0) {
      const seekToStart = () => {
        try { audio.currentTime = startSec; } catch (_) {}
      };
      audio.addEventListener("loadedmetadata", seekToStart, { once: true });
      if (audio.readyState >= 1) seekToStart();
    }

    // Auto-advance to the next episode when the song finishes — same
    // page-out fade as the Next Episode button.
    audio.addEventListener("ended", () => {
      if (!started || paused) return;
      const cur = SEASON_ORDER.indexOf(key);
      const nxt = SEASON_ORDER[(cur + 1) % SEASON_ORDER.length];
      document.body.classList.add("is-leaving");
      stopBeats();
      setTimeout(() => {
        window.location.href = `player.html?p=${encodeURIComponent(nxt)}`;
      }, 540);
    });

    // ----- Slideshow controller -----
    let idx = 0;
    let slideTimer = null;
    let started = false;
    let paused = false;
    let prevSlide = null;

    // Beat metronome — drives image slide advances + per-beat backdrop
    // glow + flash. BPM is hard-coded per song; no Web Audio analysis.
    let beatTimer = null;
    let beatMs = 0;
    let beatNum = 0;
    function startBeats() {
      if (!season.bpm) return;
      stopBeats();
      beatMs = 60000 / season.bpm;
      // Make flash + edge-glow animation duration match the beat itself,
      // so they breathe with the song instead of snapping. 0.85× so each
      // pulse has settled before the next one fires.
      document.documentElement.style.setProperty(
        "--beat-duration", `${Math.round(beatMs * 0.85)}ms`
      );
      beatTimer = setInterval(onBeat, beatMs);
    }
    function stopBeats() {
      if (beatTimer) { clearInterval(beatTimer); beatTimer = null; }
    }
    // If a season defines tempoPhases, return the active beatsPerSlide
    // based on where we are in the song. Otherwise the static one.
    function activeBeatsPerSlide() {
      if (season.tempoPhases && season.tempoPhases.length) {
        const t = audio.currentTime;
        for (const phase of season.tempoPhases) {
          if (t < phase.until) return phase.beatsPerSlide;
        }
      }
      return season.beatsPerSlide;
    }

    function onBeat() {
      if (paused || audio.paused) return;
      beatNum += 1;

      // Edge-glow pulse — radial gradients in season accent color, like
      // EDM stage lighting breathing in from the edges.
      if (beatGlow) {
        beatGlow.classList.remove("is-pulse");
        void beatGlow.offsetWidth;
        beatGlow.classList.add("is-pulse");
      }

      // Soft full-screen flash (kept very low strength + long duration)
      if (flash) {
        flash.classList.remove("is-pulse");
        void flash.offsetWidth;
        flash.classList.add("is-pulse");
      }

      // Backdrop pulse — the blurred backdrop temporarily brightens /
      // saturates. The foreground photo never moves, so no "wobble".
      if (prevSlide) {
        const target = prevSlide;
        target.classList.add("is-beating");
        clearTimeout(target._beatT);
        target._beatT = setTimeout(
          () => target.classList.remove("is-beating"),
          Math.max(90, beatMs * 0.35)
        );
      }

      // Advance slide every Nth beat — but only for IMAGE slides. Video
      // slides have their own end-of-clip / cap timing in showSlide().
      const bps = activeBeatsPerSlide();
      if (prevSlide && !prevSlide._video && bps
          && beatNum % bps === 0) {
        advance();
      }
    }

    function advance() {
      // Skip any slide tagged broken (e.g. a video the browser can't decode)
      // so the reel never freezes on an undecodable asset.
      let next = idx;
      let safety = slides.length;
      do {
        next = (next + 1) % slides.length;
        safety -= 1;
      } while (safety > 0 && slides[next] && slides[next].dataset.broken === "true");
      idx = next;
      showSlide(idx);
    }

    function showSlide(i) {
      const next = slides[i];
      if (!next) return;

      // Mark previous as leaving (CSS animates it out)
      if (prevSlide && prevSlide !== next) {
        prevSlide.classList.remove("is-active");
        prevSlide.classList.add("is-leaving");
        const stale = prevSlide;
        // Pause any running video and detach handlers so a stale video
        // can't keep firing into the player after we've moved on.
        if (stale._video) {
          try { stale._video.pause(); } catch (_) {}
          stale._video.ontimeupdate = null;
          stale._video.onended      = null;
          stale._video.onerror      = null;
        }
        const leaveMs = Math.max(season.transitionMs, 300);
        setTimeout(() => stale.classList.remove("is-leaving"), leaveMs);
      }

      // Restart entry animation by toggling the class with a forced reflow
      next.classList.remove("is-active");
      void next.offsetWidth;
      next.classList.add("is-active");

      // Spring beat flash on every cut
      if (season.beat && flash) {
        flash.classList.remove("is-pulse");
        void flash.offsetWidth;
        flash.classList.add("is-pulse");
      }

      prevSlide = next;
      clearTimeout(slideTimer);
      beatNum = 0;          // restart beat counter per slide so the next
                            // image cuts after exactly N beats from now

      // Video slides advance on `ended` (full playback) — with a hard cap
      // so a stuck/unsupported video can't freeze the reel. Three layers:
      //   1. `ended` event   → natural finish
      //   2. setTimeout(cap) → wall-clock guard
      //   3. timeupdate guard → hard stop based on the video's own clock,
      //      in case the browser ignores playbackRate (some Firefox builds
      //      do this for QuickTime-flagged MP4s) and setTimeout is throttled
      const startedAt = performance.now();
      if (next._video) {
        const v = next._video;
        const cap = next._duration || season.slideMs;

        v.onended = () => { if (prevSlide === next) advance(); };
        v.onerror = () => {
          next.dataset.broken = "true";
          if (prevSlide === next) advance();
        };
        v.ontimeupdate = () => {
          if (prevSlide !== next) return;
          // Force-advance if wall-clock OR video-clock has exceeded cap.
          const wall = performance.now() - startedAt;
          if (wall >= cap) {
            try { v.pause(); } catch (_) {}
            advance();
          }
        };

        try {
          // Hard reset: pause → reload metadata → seek to 0 → set rate.
          // Without v.load() some browsers will resume the element from
          // wherever the pre-roll loop happened to leave the playhead,
          // which reads as the clip "repeating".
          v.pause();
          v.loop = false;
          try { v.load(); } catch (_) {}
          v.currentTime = 0;
          v.playbackRate = next._playbackRate || 1;
          const playPromise = v.play();
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.catch(() => { /* will fall through to cap */ });
          }
        } catch (_) { /* no-op */ }

        slideTimer = setTimeout(advance, cap);
        return;
      }

      // Image slide:
      //   • beat-synced season → metronome drives the cut; the setTimeout
      //     here is a safety net at 2× the nominal slide length in case
      //     the metronome stalls.
      //   • normal season       → setTimeout is the primary advance.
      const dwell = season.bpm ? season.slideMs * 2 : season.slideMs;
      slideTimer = setTimeout(advance, dwell);
    }

    // Pre-roll: show first slide as a static poster so the player isn't blank.
    // If it's a video it loops silently until the user hits Play. If the
    // browser can't decode the video, fall back to the first image slide
    // so the user always sees a poster instead of a black frame.
    function fallbackPoster() {
      // Find first non-broken slide and show it as poster
      const idx0 = slides.findIndex(s => s.dataset.broken !== "true" && !s._video);
      const target = slides[idx0] || slides[1] || slides[0];
      if (!target) return;
      slides.forEach(s => s.classList.remove("is-active"));
      target.classList.add("is-active");
      prevSlide = target;
      idx = slides.indexOf(target);
    }

    if (slides[0]) {
      slides[0].classList.add("is-active");
      prevSlide = slides[0];
      if (slides[0]._video) {
        const v = slides[0]._video;
        v.loop = true;
        v.addEventListener("error", () => {
          slides[0].dataset.broken = "true";
          fallbackPoster();
        }, { once: true });
        // Some codecs fail without firing 'error' — also bail if the
        // metadata never loads within ~2s of being attached.
        const fallbackTimer = setTimeout(() => {
          if (v.readyState < 1) {
            slides[0].dataset.broken = "true";
            fallbackPoster();
          }
        }, 2000);
        v.addEventListener("loadedmetadata", () => clearTimeout(fallbackTimer), { once: true });
        try { v.play().catch(() => {}); } catch (_) {}
      }
    }

    // ----- Play button -----
    playBtn.addEventListener("click", startExperience);

    function startExperience() {
      if (started) return;
      started = true;

      playBtn.classList.add("is-hidden");
      chrome.setAttribute("aria-hidden", "false");
      pauseBtn.dataset.paused = "false";
      nudgeChrome(); // start the 3-second idle countdown

      // Fade audio in over 1.5s. If metadata hadn't loaded in time and the
      // cue-point hasn't applied yet, force it now.
      audio.muted = false;
      if (startSec > 0 && audio.currentTime < startSec - 1) {
        try { audio.currentTime = startSec; } catch (_) {}
      }
      const target = 0.75;
      const steps = 30;
      const stepMs = 50;
      let i = 0;
      audio.play().catch(() => { /* user can retry via mute toggle */ });
      const fade = setInterval(() => {
        i += 1;
        audio.volume = Math.min(target, (i / steps) * target);
        if (i >= steps) clearInterval(fade);
      }, stepMs);

      // Take first-slide video out of poster-loop mode so it advances normally
      if (slides[0] && slides[0]._video) {
        slides[0]._video.loop = false;
      }
      // Restart the reel. If slide 0 is broken (e.g. unsupported codec)
      // begin from the first playable slide instead.
      const startIdx = (slides[0] && slides[0].dataset.broken === "true")
        ? Math.max(0, slides.findIndex(s => s.dataset.broken !== "true"))
        : 0;
      idx = startIdx;
      showSlide(startIdx);

      // Kick off the beat metronome
      startBeats();
    }

    // ----- Pause / resume -----
    pauseBtn.addEventListener("click", () => {
      if (!started) { startExperience(); return; }
      paused = !paused;
      pauseBtn.dataset.paused = paused ? "true" : "false";
      pauseBtn.setAttribute("aria-label", paused ? "Resume" : "Pause");

      if (paused) {
        clearTimeout(slideTimer);
        stopBeats();
        if (prevSlide && prevSlide._video) {
          try { prevSlide._video.pause(); } catch (_) {}
        }
        try { audio.pause(); } catch (_) {}
      } else {
        // Resume: re-show current slide so its timer rearms cleanly
        showSlide(idx);
        if (prevSlide && prevSlide._video) {
          try { prevSlide._video.play().catch(() => {}); } catch (_) {}
        }
        try { audio.play().catch(() => {}); } catch (_) {}
        startBeats();
      }
    });

    // ----- Mute toggle -----
    muteBtn.addEventListener("click", () => {
      const muted = !audio.muted;
      audio.muted = muted;
      muteBtn.dataset.muted = muted ? "true" : "false";
      muteBtn.setAttribute("aria-label", muted ? "Unmute audio" : "Mute audio");
      if (!muted && audio.paused && started) {
        audio.play().catch(() => {});
      }
    });

    // ----- Seek prev / next slide (10-second buttons mapped to slide steps) -----
    function stepSlide(delta) {
      if (!started) startExperience();
      let target = idx;
      let safety = slides.length;
      do {
        target = (target + delta + slides.length) % slides.length;
        safety -= 1;
      } while (safety > 0 && slides[target] && slides[target].dataset.broken === "true");
      idx = target;
      // Resuming if paused
      if (paused) {
        paused = false;
        pauseBtn.dataset.paused = "false";
      }
      showSlide(idx);
      try { if (audio.paused && !audio.muted) audio.play().catch(() => {}); } catch (_) {}
    }
    seekBack.addEventListener("click", () => stepSlide(-1));
    seekFwd.addEventListener("click",  () => stepSlide(+1));

    // ----- Progress bar (audio scrubber) -----
    function fmtTime(s) {
      if (!isFinite(s) || s < 0) s = 0;
      s = Math.floor(s);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      const pad = (n) => String(n).padStart(2, "0");
      return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
    }
    audio.addEventListener("timeupdate", () => {
      const dur = audio.duration;
      const cur = audio.currentTime;
      const pct = dur && isFinite(dur) ? (cur / dur) * 100 : 0;
      pfill.style.width = pct + "%";
      if (pthumb) pthumb.style.left = pct + "%";
      ptime.textContent = fmtTime(cur);

      // Toggle "is-slow-phase" when in a tempoPhase window. CSS uses
      // this to swap from snappy linear cuts → dreamy long crossfade.
      if (season.tempoPhases && season.tempoPhases.length) {
        const inSlow = season.tempoPhases.some(p => cur < p.until);
        document.body.classList.toggle("is-slow-phase", inSlow);
      }
    });
    audio.addEventListener("loadedmetadata", () => {
      ptime.textContent = fmtTime(audio.currentTime);
    });
    // (Progress bar is intentionally display-only — scrubbing is disabled.)

    // ----- Episodes drawer -----
    function buildDrawer() {
      drawerList.innerHTML = "";
      SEASON_ORDER.forEach((k, i) => {
        const s = SEASONS[k];
        const item = document.createElement("button");
        item.type = "button";
        item.className = "drawer__item" + (k === key ? " is-current" : "");
        item.innerHTML = `
          <span class="drawer__thumb" style="background-image:url('${assetUrl(s.folder, s.thumb)}')"></span>
          <span class="drawer__meta">
            <span class="drawer__num">Episode ${i + 1}</span>
            <span class="drawer__name">${s.title}</span>
            <span class="drawer__desc">${s.tagline || ""}</span>
          </span>
        `;
        item.addEventListener("click", () => {
          if (k === key) { closeDrawer(); return; }
          document.body.classList.add("is-leaving");
          try { audio.pause(); } catch (_) {}
          setTimeout(() => {
            window.location.href = `player.html?p=${encodeURIComponent(k)}`;
          }, 480);
        });
        drawerList.append(item);
      });
    }
    function openDrawer()  { drawer.setAttribute("aria-hidden", "false"); }
    function closeDrawer() { drawer.setAttribute("aria-hidden", "true"); }
    if (epListBtn) epListBtn.addEventListener("click", () => { buildDrawer(); openDrawer(); });
    if (drawerClose) drawerClose.addEventListener("click", closeDrawer);

    // Audio & Subtitles dummy → just toggles mute (visible signal that it works)
    if (epAudioBtn) epAudioBtn.addEventListener("click", () => muteBtn.click());

    // Cast dummy: brief pulse so the user knows it's wired
    if (castBtn) castBtn.addEventListener("click", () => {
      castBtn.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }],
        { duration: 400, easing: "cubic-bezier(.16,1,.3,1)" }
      );
    });

    // Fullscreen toggle
    function toggleFullscreen() {
      const el = document.documentElement;
      const isFs = document.fullscreenElement || document.webkitFullscreenElement;
      try {
        if (isFs) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        }
      } catch (_) { /* not supported */ }
    }
    if (fsBtn) fsBtn.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", () => {
      if (fsBtn) fsBtn.dataset.on = document.fullscreenElement ? "true" : "false";
    });

    // Pause music when tab hidden, resume on focus
    document.addEventListener("visibilitychange", () => {
      if (!started) return;
      if (document.hidden) {
        audio.pause();
        stopBeats();
      } else if (!audio.muted && !paused) {
        audio.play().catch(() => {});
        startBeats();
      }
    });

    // ----- Idle auto-hide for chrome (Netflix-style) -----
    let idleTimer = null;
    const IDLE_MS = 1500;
    function nudgeChrome() {
      player.classList.remove("is-idle");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Don't hide before user has actually started playback
        if (started) player.classList.add("is-idle");
      }, IDLE_MS);
    }
    ["mousemove", "touchstart", "keydown", "click"].forEach((evt) => {
      window.addEventListener(evt, nudgeChrome, { passive: true });
    });

    // ----- Next Episode (cycle through seasons with smooth fade-out) -----
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const cur = SEASON_ORDER.indexOf(key);
        const nxt = SEASON_ORDER[(cur + 1) % SEASON_ORDER.length];
        // Smoothly fade page out, then navigate
        document.body.classList.add("is-leaving");
        try { audio.pause(); } catch (_) {}
        setTimeout(() => {
          window.location.href = `player.html?p=${encodeURIComponent(nxt)}`;
        }, 540);
      });
    }

    // Keyboard: Space pause/play, M mute, N next episode, F fullscreen
    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea")) return;
      if (e.code === "Space") {
        e.preventDefault();
        pauseBtn.click();
      } else if (e.key === "m" || e.key === "M") {
        muteBtn.click();
      } else if (e.key === "n" || e.key === "N") {
        if (nextBtn) nextBtn.click();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    });
  }
})();
