(function initDonationStarStore() {
  window.createDonationStarStore = function createDonationStarStore(initialStars = [], limit = 80) {
    const stars = new Map();
    const keyFor = (star) => star.clientId || star.id;
    const sortedValues = () => Array.from(stars.values()).sort((left, right) => (
      String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
    ));

    function trim() {
      const overflow = sortedValues().slice(0, Math.max(0, stars.size - limit));
      overflow.forEach((star) => stars.delete(keyFor(star)));
    }

    function addOrReplace(star) {
      const key = keyFor(star);
      if (!key) throw new Error('Donation star requires an id');
      const previous = stars.get(key);
      const merged = previous ? { ...previous, ...star } : { ...star };
      stars.set(key, merged);
      trim();
      return { isNew: !previous, star: merged };
    }

    function remove(star) {
      const key = keyFor(star);
      const matchingKeys = Array.from(stars.entries())
        .filter(([storedKey, storedStar]) => storedKey === key || storedStar.id === star.id)
        .map(([storedKey]) => storedKey);
      matchingKeys.forEach((storedKey) => stars.delete(storedKey));
      return matchingKeys.length > 0;
    }

    function replaceAll(nextStars) {
      stars.clear();
      nextStars.forEach((star) => addOrReplace(star));
    }

    initialStars.forEach((star) => addOrReplace(star));

    return {
      addOrReplace,
      remove,
      replaceAll,
      values: sortedValues,
    };
  };
}());
