document.addEventListener('alpine:init', () => {
  Alpine.data('position',function(){
    return {
        currentSlide: this.$persist(""),
        initialized: false,
        init(){
            try{
                if (this.currentSlide){
                    let item = document.getElementById(this.currentSlide);
                    console.log(item);
                    item.scrollIntoView({ behavior: 'smooth' });
                }
            } finally {
                this.initialized = true;
            }
        },
        setSlide(id){
            if (this.initialized){
                this.currentSlide = id;
            }
        }
    }
  });
  Alpine.data('stepVideo', function () {
    return {
      stops: [],
      current: 0,
      playingTo: null,
      playing: false,

      init() {
        this.stops = JSON.parse(this.$root.getAttribute('data-stops'));
        const video = this.$refs.stepVideo;

        // Pauzeer automatisch bij het bereiken van de volgende stop
        video.addEventListener('timeupdate', () => {
          if (this.playingTo !== null && video.currentTime >= this.playingTo - 0.05) {
            video.pause();
            this.playing = false;
            this.playingTo = null;
          }

          // Bepaal huidige segment
          const t = video.currentTime;
          let idx = this.stops.findIndex((s) => t < s - 0.1);
          this.current = idx === -1 ? this.stops.length - 1 : Math.max(idx - 1, 0);
        });

        // Startpositie
        video.currentTime = this.stops[0];
        video.pause();
      },

      registerStops(stops){
        this.stops = stops;
      },
      prev() {
          const video = this.$refs.stepVideo;
          if (this.current > 0) {
            const target = this.stops[this.current - 1];
            const step = 0.05; // seconden per frame terug
            const fps = 60; // snelheid van de “reverse playback”

            // Eerst stoppen wat eventueel loopt
            if (this.reverseTimer) clearInterval(this.reverseTimer);
            video.pause();

            // Reverse-animatie
            this.reverseTimer = setInterval(() => {
              if (video.currentTime <= target + step) {
                clearInterval(this.reverseTimer);
                video.currentTime = target;
                video.pause();
                this.current--;
                this.playing = true;
                return;
              }
              video.currentTime -= step;
            }, 1000 / fps);
          }
        },

      next() {
        const video = this.$refs.stepVideo;
        if (this.current < this.stops.length - 1) {
          this.playingTo = this.stops[this.current + 1];
          video.play();
          this.playing = true;
        }
      },
    };
  });
});