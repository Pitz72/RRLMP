#import "../lib/manuale-template.typ": *

= 安装与首次启动
<第-2-章-安装与首次启动>

Runtime Live Machine Pro
的安装尽量不折腾人：点几下鼠标，不需要手动配置，也不需要另装什么前置组件。音频引擎（FFmpeg）已经打包在安装程序里，不用你操心。

== 2.1 系统要求
<系统要求>
开始之前，先确认电脑满足最低要求。长时间会话或同时加载大量片段时，推荐配置能给出最好的体验。

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([], [最低], [推荐],),
    table.hline(),
    [#strong[操作系统（Windows）]], [Windows 10 64-bit], [Windows 11
    64-bit],
    [#strong[操作系统（macOS）]], [macOS 11 Big Sur], [macOS 13 Ventura
    或更新],
    [#strong[操作系统（Linux）]], [Ubuntu 20.04 / Debian 11], [Ubuntu
    22.04 LTS],
    [#strong[RAM]], [4 GB], [8 GB 或更多],
    [#strong[磁盘空间]], [300 MB（应用本体）], [1 GB +
    音频文件所需空间],
    [#strong[CPU]], [任意现代双核], [四核或更高],
  )]
  , kind: table
  )

软件针对 Apple Silicon（M1、M2、M3）做了优化，在两种 macOS
架构上都能原生运行，不需要 Rosetta 转译。

不需要专用声卡。只要是操作系统能识别的音频设备，RLMP
都能配合工作------从集成声卡到 Rødecaster Pro、RØDECaster Duo 这类专业
USB 混音器皆可。

== 2.2 在 Windows 上安装
<在-windows-上安装>
+ 从官方分发渠道下载文件 `Runtime-Live-Machine-Pro-1.11.5.exe`。
+ 双击该可执行文件。NSIS 安装程序会启动，并将文件复制到相应目录。
+ 完成后，会在桌面和开始菜单中创建快捷方式。
+ 安装完成时，应用会自动启动。

#strong[关于 Windows SmartScreen。]
软件更新频繁，数字签名证书可能还没积累够进入 SmartScreen
自动白名单所需的「信誉」。若弹出「Windows
已保护你的电脑」提示，点击#emph[更多信息]，再点击#emph[仍要运行]即可。软件不含恶意程序，官方安装包只通过作者的分发渠道发布。

== 2.3 在 macOS 上安装
<在-macos-上安装>
+ 从官方渠道下载 `.dmg` 文件。
+ 打开该映像文件，将 Runtime Live Machine Pro
  的图标拖入#emph[应用程序]文件夹。
+ 首次启动时，macOS 可能弹出 Gatekeeper 提示（「无法打开该
  App，因为它来自身份不明的开发者」）。这时打开#emph[系统偏好设置] →
  #emph[安全性与隐私] →
  #emph[通用]，在应用名称旁点击#emph[仍要打开]即可继续。

从 macOS 15（Sequoia）起，路径改为#emph[系统设置] →
#emph[隐私与安全性]，向下滚动到#emph[安全性]部分。

#nota[
macOS 应用没有用 Apple Developer
证书签名，这也影响更新的处理方式，详见第 12 章。
]

== 2.4 在 Linux 上安装
<在-linux-上安装>
提供两种分发格式：

- #strong[AppImage] ---
  便携式可执行文件，无需安装，把文件设为可执行（`chmod +x`）后直接运行。
- #strong[\.deb 软件包] --- 适用于 Debian/Ubuntu/Mint 发行版，用
  `sudo dpkg -i nomefile.deb` 安装，或用图形化包管理器打开。

某些发行版可能需要安装 `libasound2` 软件包才能支持 ALSA
音频。应用若无法启动，请查阅所用发行版的文档。

== 2.5 欢迎界面
<欢迎界面>
#figure(image("../screenshots-zh-cn/schermata-benvenuto.png", alt: "图 2.1 — 欢迎界面：软件标识、更新状态、主要操作与语言选择器。"),
  caption: [
    图 2.1 --- 欢迎界面：软件标识、更新状态、主要操作与语言选择器。
  ]
)

首次启动时------以及此后每次启动，直到你打开某个项目为止------RLMP
都会显示#strong[欢迎界面]，所有前置操作都从这里开始。面板分两个区域。

#strong[左区 --- 标识与操作。] 软件的 logo（一组 VU meter
竖条加播放符号）标出这是 Pro 版本。标题与 slogan
下方显示已安装的版本号，以及更新系统的状态：

- #strong[「已是最新版本」]（绿色）------当前已是最新版本。
- #strong[「发现新版本」]（琥珀色，闪烁）------这是一个按钮，点击可打开更新窗口（第
  12 章）。
- #strong[「OFFLINE」]（暗红色）------联系不到更新服务，软件照常运行。

下方是主要操作：

- #emph[新建项目] --- 创建一个空会话，各列就绪待用。
- #emph[加载项目] --- 打开一个现有的 `.lmp` 文件。RLMP
  会先执行一次#strong[完整性检查]：核对每个被引用的音频文件是否还在记录的路径上，缺失的文件会立刻以红色边框标注在对应片段上。
- #emph[手册] --- 这一项目前禁用：软件内文档会在后续版本中通过网络提供。

#strong[右区 --- 语言选择器。] RLMP
支持八种界面语言：英语、意大利语、法语、德语、西班牙语、葡萄牙语、俄语和简体中文。当前语言以青色边框和勾选标记突出显示，选择立即生效，且在各次会话之间保持记忆。

== 2.6 首次启动：应当预期什么
<首次启动应当预期什么>
首次打开项目时，页眉上会出现带虹彩渐变 #strong[PRO] 徽标的
logo。表面看不见的地方，打开项目同时在后台启动了音频引擎：FFmpeg
完成初始化，`media://`
流式协议开始监听，随时准备把文件从磁盘直接送出而不载入内存。

软件默认以全屏模式启动。若窗口以较小尺寸打开，按
`F11`（Windows/Linux）或
`Ctrl+Cmd+F`（macOS）切到全屏------这是导播工作的最佳状态。

页眉中的 #strong[On Air 计时器]会停在
`--:--:--`，直到本次会话第一个片段被触发才开始计时，此后持续累计直播已流逝的时间。用固定时长播出单的人，会用得上这个参照。
