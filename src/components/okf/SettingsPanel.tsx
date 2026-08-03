import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Terminal, Trash2 } from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";
import {
  cliSupported,
  installCli,
  readCliStatus,
  uninstallCli,
  UNKNOWN_STATUS,
  type CliStatus,
} from "@/lib/platform/cli";

/**
 * Reads as a command line on purpose — this card is about a shell command, and
 * a monospace block is the shortest way to say "type this".
 */
function Usage() {
  return (
    <pre className="rounded-md border border-border bg-bg-subtle px-3 py-2 text-xs overflow-x-auto">
      <code>
        {"okff .            # open the current directory\n"}
        {"okff ~/my-okf     # open a specific one\n"}
        {"okff --help"}
      </code>
    </pre>
  );
}

export function SettingsPanel() {
  const showToast = useOkfStore((s) => s.showToast);
  const [status, setStatus] = useState<CliStatus>(UNKNOWN_STATUS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported = cliSupported();

  const refresh = useCallback(() => {
    void readCliStatus()
      .then(setStatus)
      .catch(() => setStatus(UNKNOWN_STATUS));
  }, []);

  useEffect(refresh, [refresh]);

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      showToast(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      refresh();
    }
  };

  // Someone else's okff. Overwriting a script the user wrote themselves without
  // saying so would be both rude and unrecoverable, so this is a separate state
  // rather than a silent install.
  const foreign = status.installed && !status.managed;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-fg">Settings</h1>
          <p className="text-sm text-fg-muted mt-1">
            Workbench preferences and the shell integration. Theme and zoom live in the header —
            zoom with <kbd className="font-mono">⌘ +</kbd> / <kbd className="font-mono">⌘ -</kbd> on
            the desktop app.
          </p>
        </div>

        <section className="panel-card space-y-3" aria-labelledby="cli-heading">
          <div className="flex items-start gap-2">
            <Terminal className="size-4 mt-0.5 shrink-0 text-fg-muted" />
            <div className="flex-1">
              <h2 id="cli-heading" className="text-sm font-semibold text-fg">
                Command line
              </h2>
              <p className="field-note">
                Install <code className="font-mono">okff</code> so you can open a folder in OKF
                Forge from any terminal.
              </p>
            </div>
          </div>

          <Usage />

          {!supported && (
            <p className="field-hint" data-testid="cli-web-note">
              This is the web build, which cannot write to your machine. Open OKF Forge as a desktop
              app to install the command.
            </p>
          )}

          {supported && (
            <>
              <p className="field-hint" data-testid="cli-state">
                {foreign ? (
                  <>
                    <AlertTriangle className="inline size-3.5 mr-1 align-text-bottom" />
                    Something else already lives at <code className="font-mono">{status.path}</code>
                    . Replacing it will overwrite that file.
                  </>
                ) : status.installed ? (
                  <>
                    <Check className="inline size-3.5 mr-1 align-text-bottom" />
                    Installed at <code className="font-mono">{status.path}</code>
                    {!status.current && " — points at an older app location, so reinstall it."}
                  </>
                ) : (
                  <>
                    Not installed. It goes to <code className="font-mono">{status.path}</code>,
                    which is already on your PATH. You will be asked for your password once if that
                    folder is not yours to write to.
                  </>
                )}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  data-testid="cli-install"
                  disabled={busy || (status.installed && status.managed && status.current)}
                  onClick={() => void run(installCli, "okff installed")}
                >
                  <Terminal className="size-3.5" />
                  {foreign ? "Replace it" : status.installed ? "Reinstall" : "Install okff"}
                </button>
                {status.installed && status.managed && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    data-testid="cli-uninstall"
                    disabled={busy}
                    onClick={() => void run(uninstallCli, "okff removed")}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                )}
              </div>

              {error && (
                <p className="field-hint text-danger" role="alert" data-testid="cli-error">
                  {error}
                </p>
              )}

              <p className="field-hint">
                Each <code className="font-mono">okff</code> opens its own window, so you can have
                two workspaces side by side. They share one preferences store, so a theme change in
                one window reaches the other only after that window reloads.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
