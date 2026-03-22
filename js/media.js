/**
 * KEK Skincare — skincare-focused images from multiple free sources.
 * Sources: Shopify Burst, Pexels, Unsplash (see README for licenses).
 *
 * Page/layout images: set in index.html (Burst / Pexels / Unsplash).
 * Product + Instagram grid: consumed from here by app.js.
 */
(function () {
  "use strict";

  function burst(slug, w) {
    return (
      "https://burst.shopifycdn.com/photos/" +
      slug +
      ".jpg?width=" +
      w +
      "&format=pjpg&exif=0&iptc=0"
    );
  }

  function pexels(id, w) {
    return (
      "https://images.pexels.com/photos/" +
      id +
      "/pexels-photo-" +
      id +
      ".jpeg?auto=compress&cs=tinysrgb&w=" +
      w
    );
  }

  function unsplash(photoPath, w, h) {
    h = h || w;
    return (
      "https://images.unsplash.com/photo-" +
      photoPath +
      "?w=" +
      w +
      "&h=" +
      h +
      "&fit=crop&q=82"
    );
  }

  window.KEK_MEDIA = {
    burst: burst,
    pexels: pexels,
    unsplash: unsplash,
    productsById: {
      "glow-cream": burst("hand-and-a-glass-jar-of-hand-cream", 800),
      "turmeric-scrub": burst(
        "close-up-of-a-hand-using-an-exfoliator-against-skin",
        800
      ),
      "bright-serum": burst("hands-hold-black-dropper-bottle", 800),
      "aloe-toner": burst("hands-hold-a-small-cosmetics-container", 800),
      "shea-body": burst("hands-using-a-tube-of-hand-cream", 800),
    },
    instaUrls: [
      burst("woman-applying-face-mask", 640),
      burst("peel-off-face-mask", 640),
      burst("face-mask-at-the-spa", 640),
      pexels(6621464, 640),
      pexels(7262932, 640),
      burst("hands-using-a-tube-of-hand-cream", 640),
      burst("woman-holds-a-jade-face-massager-to-her-face", 640),
      unsplash("1556228578-0d85b1a4d571", 640, 640),
    ],
  };
})();
