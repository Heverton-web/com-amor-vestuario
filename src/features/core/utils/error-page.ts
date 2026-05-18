export function renderErrorPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Erro Interno</title>
  <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 2rem;">
  <h1>Erro Interno do Servidor</h1>
  <p>Ocorreu um erro inesperado. Por favor, tente novamente.</p>
</body>
</html>`;
}
