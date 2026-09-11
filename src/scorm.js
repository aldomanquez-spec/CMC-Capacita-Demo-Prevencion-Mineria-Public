/* SCORM 1.2 adapter: no LMS is required for standalone playback. */
(function (root) {
  'use strict';
  function createSession(host) {
    let api = null, initialized = false, finished = false;
    const truth = value => value === true || value === 'true';
    function find(start) {
      let current = start;
      for (let n = 0; current && n < 100; n++) {
        try { if (current.API) return current.API; if (current.parent === current) break; current = current.parent; }
        catch { break; }
      }
      return null;
    }
    function call(method, ...args) {
      try { return api?.[method](...args); } catch { return ''; }
    }
    const session = {
      init() {
        if (initialized || finished) return initialized;
        api = find(host);
        if (!api) { try { api = find(host.opener); } catch { /* Cross-origin opener. */ } }
        initialized = !!api && truth(call('LMSInitialize', ''));
        if (initialized) {
          const status = session.get('cmi.core.lesson_status');
          if (!status || status === 'not attempted') session.set('cmi.core.lesson_status', 'incomplete');
          session.commit();
        }
        return initialized;
      },
      get(key) { return initialized && !finished ? String(call('LMSGetValue', key) ?? '') : ''; },
      set(key, value) { return initialized && !finished && truth(call('LMSSetValue', key, String(value))); },
      commit() { return initialized && !finished && truth(call('LMSCommit', '')); },
      complete() {
        if (!initialized || finished) return false;
        return session.set('cmi.core.lesson_status', 'completed') && session.set('cmi.core.exit', '') && session.commit();
      },
      finish() {
        if (!initialized || finished) return false;
        session.commit();
        const ok = truth(call('LMSFinish', ''));
        if (ok) finished = true;
        return ok;
      },
      get connected() { return initialized; }
    };
    return session;
  }
  root.createScormSession = createSession;
})(globalThis);
