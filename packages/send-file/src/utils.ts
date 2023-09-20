export function getFileName(file: File) {
  return `文件(${file.name})`
}

export function getFileInfo(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

export function getRandomInt(min = 1, max = 1000000) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min // 不含最大值，含最小值
}
