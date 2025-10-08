function smoothScrollTo(target, duration = 1500) {
  const start = window.scrollY || document.documentElement.scrollTop;
  const distance = target - start;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);

    // easing (hier cubic in/out)
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, start + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function autoScrollUntil(checkFn, speed = 9) {
  let lastTime = performance.now();

  function step(now) {
    // delta-tijd zodat snelheid framerate-onafhankelijk is
    const dt = (now - lastTime) / 16.67; // 16.67 ≈ 1 frame bij 60 Hz
    lastTime = now;

    // voer je check uit: zodra true → stoppen
    if (checkFn()) return;

    // scroll iets verder
    window.scrollBy(0, speed * dt);

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

document.addEventListener('alpine:init', () => {
  Alpine.data('presentationPosition', () => ({
    position: 0,
    has_previous: false,
    has_next: true,
    frames: [
      0,
      1200,
      1567,
      2652,
      3163,
      3885,
      4843,

      5917,

      9000,
      8817,
      9200,
      9500,
      9800,
      10100,

    ],

    snapThreshold: 50, // instelbaar: hoeveel pixels voorbij een frame = snap naar volgende
    isSnapping: false, // voorkomt dat tijdens smooth-scroll opnieuw wordt gesnapped
    anchorFrame: 0, // het frame waar we vanaf scrollen

    whySub: '"The dream"',
    updateWhySub(title){
        this.whySub = `${title}`;
    },

    init() {
      const pos = localStorage.getItem("position");
      if (pos) {
        window.scrollTo({
          top: parseInt(pos, 10),
          behavior: 'instant'
        });
      }
      // Zet anchor op dichtstbijzijnde frame bij start
      this.anchorFrame = this.findClosestFrame(pos || 0);
    },

    update() {
      const pos = window.scrollY || document.documentElement.scrollTop;
      this.position = pos;

      // Standaard logica
      localStorage.setItem("position", this.position);
      this.has_previous = this.position > this.frames.at(0);
      this.has_next = this.position < this.frames.at(-1);
    },

    onScrollEnd() {
      return
      if (this.isSnapping) return;

      // Stap 1: zoek eerst het dichtstbijzijnde frame
      const closestFrame = this.findClosestFrame(this.position);

      // Stap 2: als die ver genoeg van anchor ligt, gebruik hem als target
      const distanceFromAnchor = Math.abs(this.position - this.anchorFrame);
      const distanceFromClosest = Math.abs(this.position - closestFrame);

      // overschrijft anchor bij grote “zwiep”
      if (distanceFromClosest < distanceFromAnchor / 2) {
        this.anchorFrame = closestFrame;
      }

      // Stap 3: bepaal nu target (eventueel op basis van scrollrichting)
      const targetFrame = this.determineTargetFrame();

      if (targetFrame !== null && Math.abs(this.position - targetFrame) > 5) {
        this.snapToFrame(targetFrame);
      }
    },

    findClosestFrame(position) {
      let closest = this.frames[0];
      let minDistance = Math.abs(position - closest);

      for (let frame of this.frames) {
        const distance = Math.abs(position - frame);
        if (distance < minDistance) {
          minDistance = distance;
          closest = frame;
        }
      }
      return closest;
    },

    determineTargetFrame() {
      const anchorIndex = this.frames.indexOf(this.anchorFrame);
      const distanceFromAnchor = this.position - this.anchorFrame;

      // Vooruit scrollen
      if (distanceFromAnchor > this.snapThreshold) {
        const nextFrame = this.frames[anchorIndex + 1];
        if (nextFrame !== undefined) {
          return nextFrame;
        }
      }

      // Achteruit scrollen
      if (distanceFromAnchor < -this.snapThreshold) {
        const prevFrame = this.frames[anchorIndex - 1];
        if (prevFrame !== undefined) {
          return prevFrame;
        }
      }

      // Binnen threshold → blijf bij anchor
      return this.anchorFrame;
    },

    snapToFrame(targetFrame) {
      this.isSnapping = true;

      // Stop momentum door instant scroll naar huidige positie
      window.scrollTo({
        top: this.position,
        behavior: 'instant'
      });

      const distance = Math.abs(targetFrame - this.position);

      // Dynamische scrolltijd (tussen min 500ms en max 2000ms)
      const snapTime = Math.min(
        Math.max(distance * 1, 1500),
        5000
      );

      // Kleine delay zodat momentum echt gestopt is
      setTimeout(() => {
        smoothScrollTo(targetFrame, snapTime);

        // Update anchor naar het nieuwe frame
        this.anchorFrame = targetFrame;

        // Reset snapping flag na smooth scroll voltooid
        setTimeout(() => {
          this.isSnapping = false;
        }, snapTime + 100);
      }, 10);
    },

    previous() {
      if (this.isSnapping) return;
      const prev = [...this.frames].reverse().find(f => f < this.position);
      if (prev !== undefined) {
        this.snapToFrame(prev);
      }
    },

    next() {
      if (this.isSnapping) return;
      const nxt = this.frames.find(f => f > this.position);
      if (nxt !== undefined) {
        this.snapToFrame(nxt);
      }
    }
  }));
  Alpine.data('fadeWindowSection', () => ({
    opacity: 0, // 0 → 1 → 0
    scrolled: 0,
    init() {
      // direct eerste keer runnen
      this.update();

      // scroll handler registreren
      this._onScroll = () => this.update();
      window.addEventListener('scroll', this._onScroll, { passive: true });
    },

    destroy() {
      // opruimen als Alpine het element verwijderd
      window.removeEventListener('scroll', this._onScroll);
    },

    update() {
      const rect = this.$el.querySelector('.fade-item').getBoundingClientRect();
      const vh = window.innerHeight;
      const center = vh / 2;

      // afstand van element-midden tot viewport-midden
      const elCenter = rect.top + rect.height / 2;
      const dist = Math.abs(center - elCenter);

      // map afstand → opacity (hoe dichter bij midden, hoe hoger)
      const maxDist = vh / 2; // buiten half scherm = 0
      let val = 1 - dist / maxDist;
      this.opacity = Math.max(0, Math.min(1, val));
      let scrolled = rect.top / rect.height;
      this.scrolled = scrolled;
    }
  }));
  Alpine.data('scrollVideo', () => ({
    progress: 0,
    visible: false,
    video: null,
    video_hook: null,

    init() {
      this.video = this.$refs.video;
      // meteen pauzeren zodat hij niet zelf gaat lopen
      this.video.pause();
    },

    update() {
      const rect = this.$el.getBoundingClientRect();
      const vh = window.innerHeight;

      // bereken hoe ver je in deze sectie bent gescrolled
      let s = (vh/2 - rect.top) / rect.height;
      s = Math.max(0, Math.min(1, s)); // clamp 0..1
      this.progress = s;

      // video zichtbaar alleen als sectie "actief" is
      this.visible = s > 0 && s < 1;

      // scrub video
      if (this.video && this.video.duration) {
        const cutoff = 2; // aantal seconden aan het einde overslaan
      const usableDuration = Math.max(0, this.video.duration - cutoff);

      this.video.currentTime = this.progress * usableDuration;
      }
    }
  }));
})