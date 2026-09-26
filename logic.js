/**
 * Pure, framework-free logic extracted from app.js so it can be unit tested
 * without a DOM. Loaded as a classic script in the browser (attaches to
 * window.DreLogic) and as CommonJS under Vitest/Node.
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.DreLogic = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  /**
   * Filter problem statements by theme and free-text search query.
   * @param {Array<{id:string,title:string,valueChain:string,oneSentence:string,techFocus:string,bottleneck:string,theme:string}>} problems
   * @param {{theme?: string, query?: string}} options
   * @returns {Array} matching problems
   */
  function filterProblems(problems, options) {
    const theme = (options && options.theme) || "all";
    const searchQuery = ((options && options.query) || "").trim().toLowerCase();

    return problems.filter((item) => {
      const matchesTheme = theme === "all" || item.theme === theme;
      const matchesSearch =
        !searchQuery ||
        item.id.toLowerCase().includes(searchQuery) ||
        item.title.toLowerCase().includes(searchQuery) ||
        item.valueChain.toLowerCase().includes(searchQuery) ||
        item.oneSentence.toLowerCase().includes(searchQuery) ||
        item.techFocus.toLowerCase().includes(searchQuery) ||
        item.bottleneck.toLowerCase().includes(searchQuery);
      return matchesTheme && matchesSearch;
    });
  }

  /**
   * Ease-out cubic curve used by the animated statistic counters.
   * @param {number} t normalized progress in [0, 1]
   * @returns {number} eased progress in [0, 1]
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Interpolate a counter value along the eased progress curve.
   * @param {number} start starting value
   * @param {number} target ending value
   * @param {number} t normalized progress in [0, 1]
   * @returns {number} current displayed value
   */
  function easedCounterValue(start, target, t) {
    const clamped = Math.min(Math.max(t, 0), 1);
    return start + (target - start) * easeOutCubic(clamped);
  }

  return { filterProblems, easeOutCubic, easedCounterValue };
});
