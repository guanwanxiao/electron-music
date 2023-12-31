import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { windowManager } from './window'
// import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import { initIpcMain } from './ipcMain'
import clc from 'cli-color'
// import { createMenu } from './menu'

const log = (text) => {
  console.log(`${clc.blueBright('[background.js]')} ${text}`)
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
class Background {
  constructor() {
    this.init()
  }
  init() {
    log('initializing')
    this.handleAppEvents()
  }
  handleAppEvents() {
    app.on('ready', async () => {
      log('app ready event')
      initIpcMain()
      this.createWindow()
      this.registerShortcut()
      // 导致问题 electron Failed to fetch extension, trying 4 more times，加载插件失败
      // installExtension(VUEJS3_DEVTOOLS)
      //   .then((name) => console.log(`Added Extension:  ${name}`))
      //   .catch((err) => console.log('An error occurred: ', err))
    })
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')
    /** 导致无法打开控制台 */
    // app.whenReady().then(()=> {
      // createMenu(this.window)
    // })
    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }
  registerShortcut() {
    // globalShortcut.register('CommandOrControl+Shift+i', function() {
    //   // this.window.webContents.openDevTools()
    // })
  }
  createWindow() {
    log('creating app window')
    const options = {
      width: 900,
      height: 670,
      frame: false, 
      // titleBarStyle: 'hidden', // 隐藏标题栏
      // titleBarStyle: 'customButtonsOnHover',
      title: 'yun music',
      show: false,
      
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      },
    }
    this.window = new BrowserWindow(options)
    windowManager.add('mainWindow', this.window)
    windowManager
    this.window.on('ready-to-show', () => {
      this.window.show()
    })

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
    // this.window.setMenuBarVisibility(false) // 隐藏菜单

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      console.log(1, process.env['ELECTRON_RENDERER_URL'])
      this.window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      const filePath = join(__dirname, '../renderer/index.html')
      console.log(2, is.dev, filePath)
      this.window.loadFile(filePath, {
        hash: 'home'
      })
    }
  }
}

export default new Background()
