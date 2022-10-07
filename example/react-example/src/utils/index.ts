const firstNames = [
    'Pino',
    'Enrico',
    'Andrea',
    'Fernando',
    'Gabriele',
    'Piero',
    'Giulio',
    'Luigi',
    'Oreste',
    'Peppino'
]
const lastNames = [
    'Giardino',
    'Destefanis',
    'Di Bello',
    'Morabito',
    'Scarcella',
    'Sapino',
    'Nocera',
    'Morelli',
    'Cielo',
    'Francese',
]

export const randomFirstName = (): string => {
    return firstNames[Math.floor(Math.random() * firstNames.length)]!
}

export const randomLastName = (): string => {
    return lastNames[Math.floor(Math.random() * lastNames.length)]!
}