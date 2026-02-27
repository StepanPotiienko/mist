import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const svg = readFileSync(resolve('./public/icon.svg'))

await sharp(svg).resize(1024, 1024).png().toFile('./public/icon-1024.png')
console.log('✓ public/icon-1024.png (iOS 1024×1024)')

await sharp(svg).resize(512, 512).png().toFile('./public/icon-512.png')
console.log('✓ public/icon-512.png  (Android 512×512)')
