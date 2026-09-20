const secureServerUrlError =
  'backendUrl must use HTTPS, except for an HTTP loopback address, and must not contain credentials.';

export function formatDesktopError(message: string | null | undefined): string | null {
  if (message == null) return null;
  const withoutWrapper = message.replace(/^Error invoking remote method '[^'\r\n]+': (?:Error: )?/, '');
  const detail = withoutWrapper || message;
  if (detail === secureServerUrlError) {
    return 'Utilise une adresse HTTPS sans identifiant ni mot de passe. HTTP est accepté uniquement pour ce Mac : localhost, 127.0.0.1 ou [::1].';
  }
  return detail;
}
