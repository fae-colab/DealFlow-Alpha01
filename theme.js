(function(){
  "use strict";
  var KEY = "dealflow-theme";
  var root = document.documentElement;
  var button = document.getElementById("themeToggle");
  function readTheme(){
    try { return localStorage.getItem(KEY) || "dark"; }
    catch (_) { return "dark"; }
  }
  function applyTheme(theme, persist){
    var selected = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", selected);
    if(button){
      var toLight = selected === "dark";
      button.setAttribute("aria-label", toLight ? "Switch to light mode" : "Switch to dark mode");
      button.setAttribute("aria-pressed", String(toLight));
      button.innerHTML = toLight ? "☀ <span>Light mode</span>" : "☾ <span>Dark mode</span>";
    }
    if(persist){
      try { localStorage.setItem(KEY, selected); }
      catch (_) { /* Theme still works for this page view if storage is unavailable. */ }
    }
  }
  applyTheme(readTheme(), false);
  if(button){
    button.addEventListener("click", function(){
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }
})();