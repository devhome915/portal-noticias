import { hashAdminPassword } from '../src/services/authService.js'

if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  throw new Error('Execute este comando em um terminal interativo para informar a senha com segurança.')
}

process.stdout.write('Senha administrativa (entrada oculta): ')
process.stdin.setRawMode(true)
process.stdin.resume()

let password = ''

process.stdin.on('data', (input: Buffer) => {
  for (const character of input.toString()) {
    if (character === '\u0003') {
      process.stdin.setRawMode(false)
      process.stdout.write('\nCancelado.\n')
      process.exit(1)
    }

    if (character === '\r' || character === '\n') {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      if (password.length < 12) {
        process.stdout.write('\nA senha deve ter pelo menos 12 caracteres.\n')
        process.exit(1)
      }
      process.stdout.write(`\nADMIN_PASSWORD_HASH=${hashAdminPassword(password)}\n`)
      process.exit(0)
    }

    if (character === '\u007f' || character === '\b') {
      password = password.slice(0, -1)
      continue
    }

    password += character
  }
})
