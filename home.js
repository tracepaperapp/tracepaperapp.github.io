
function autoScrollUntil(checkFn, speed = 9, direction = "down") {
  let lastTime = performance.now();
  const dir = direction === "up" ? -1 : 1;

  function step(now) {
    const dt = (now - lastTime) / 16.67; // framerate-onafhankelijk
    lastTime = now;

    // Stoppen zodra de voorwaarde true wordt
    if (checkFn()) return;

    // Scroll verder in de gekozen richting
    window.scrollBy(0, dir * speed * dt);

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

document.addEventListener('alpine:init', () => {
  Alpine.data('presentationPosition', function(){
    return {
        position: this.$persist(0),
        frame: this.$persist(""),
        frames: this.$persist([]),
        whySub: this.$persist('"The dream"'),
        resting: false,
        howSub: this.$persist('"Composable architecture"'),
        init() {
          if (this.position) {
            window.scrollTo({
              top: parseInt(this.position, 10),
              behavior: 'instant'
            });
          }
        },
        update() {
          const pos = window.scrollY || document.documentElement.scrollTop;
          this.position = pos;
        },
        updateWhySub(title){
            this.whySub = `"${title}"`;
        },
        updateHowSub(title){
            this.howSub = `"${title}"`;
        },
        registerFrame(frame){
            if (this.frame != frame){
                this.frame = frame;
                this.resting = true;
            }
            if (!this.frames.includes(frame)){
                this.frames.push(frame);
            }
        },
        scrollToFrame(frame){
            if (!this.frames.includes(frame)){
                autoScrollUntil(() => this.frame == frame, 9, "down");
            } else {
                let current = this.frames.indexOf(this.frame);
                let target = this.frames.indexOf(frame);
                let direction = current > target ? "up" : "down";
                let speed =  Math.abs(target-current) * 2;
                speed = Math.max(speed, 6);
                speed = Math.min(speed,18);
                console.log(speed);
                autoScrollUntil(() => this.frame == frame, speed, direction);
            }
        },
        next(){
            this.resting = false;
            autoScrollUntil(() => this.resting, 9, "down");
        },
        previous(){
            this.resting = false;
            autoScrollUntil(() => this.resting, 9, "up");
        }
  }});
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