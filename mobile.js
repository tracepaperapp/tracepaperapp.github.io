document.addEventListener('alpine:init', () => {
  Alpine.data('stepVideo', function () {
    return {
      stops: [],
      current: 0,
      playingTo: null,

      init() {
        const video = this.$refs.why;

        // Pauzeer automatisch bij het bereiken van de volgende stop
        video.addEventListener('timeupdate', () => {
          if (this.playingTo !== null && video.currentTime >= this.playingTo - 0.05) {
            video.pause();
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
          const video = this.$refs.why;
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
                return;
              }
              video.currentTime -= step;
            }, 1000 / fps);
          }
        },

      next() {
        const video = this.$refs.why;
        if (this.current < this.stops.length - 1) {
          this.playingTo = this.stops[this.current + 1];
          video.play();
        }
      },
    };
  });
});