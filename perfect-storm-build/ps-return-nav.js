/* Perfect Storm return path — deployment mechanic, not page content.
   Loads the host site's universal hamburger AFTER React has hydrated the
   document, so no nav DOM exists during hydration. Frozen header, layout,
   copy, controls and evidence states are untouched. */
(function () {
  var SRC = "/EARLYWINE-PRESIDENTIAL-BLUEPRINT/assets/js/hamburger-everywhere.js";
  function load() {
    if (document.querySelector('script[data-ps-return-nav]')) return;
    var s = document.createElement("script");
    s.src = SRC;
    s.defer = true;
    s.setAttribute("data-ps-return-nav", "true");
    document.body.appendChild(s);
  }
  function afterHydration() {
    // two frames past load: hydrateRoot(document, …) has committed by then
    requestAnimationFrame(function () { requestAnimationFrame(load); });
  }
  if (document.readyState === "complete") afterHydration();
  else window.addEventListener("load", afterHydration, { once: true });
})();
