#import "../lib/manuale-template.typ": *

= Pad FX 与 Automix 视图
<第-7-章-pad-fx-与-automix-视图>

两个工作面浮在网格之上，各用一个按键唤出，服务于导播中两种相反的时刻：#strong[pad
FX] 用来稳稳触发效果和 stacco 而不打断任何内容，#strong[Automix 视图]
用来像 DJ 那样管理音乐流。两者都不占网格空间，需要时打开，一点就关。

== 7.1 Pad FX：jingle machine
#figure(image("../screenshots-zh-cn/pad-fx.png", alt: "图 7.1 — pad FX：5×5 的音效 jingle machine，支持叠加式触发。"),
  caption: [
    图 7.1 --- pad FX：5×5 的音效 jingle machine，支持叠加式触发。
  ]
)

音效在网格中没有列，它们存活于 #strong[pad FX]
里------一个由格子组成的网格面板（一台 #emph[jingle machine]），由页眉的
#strong[FX] 按钮打开，浮在屏幕一角。

pad
是#strong[非阻断式浮层]：不遮挡看板，也不拦截指向别处的点击。你可以触发一个效果，同时继续操作各列或页眉的命令。正因如此，`Esc`
键不会关闭 pad，它仍是 STOP ALL 命令，随时可用。pad
靠自己的关闭按钮，或再次点击 FX 开关来关闭。

=== 加载与触发效果
<加载与触发效果>
pad 初始是一个 25
格（5×5）的网格，添加更多效果时会按行增长。填充它的办法跟网格某一列一样------#strong[把音频文件直接拖到
pad 的格子上]。

单击格子就#strong[触发效果]。pad
的效果是复音的、可叠加：多个格子能一起响，叠在正在播出的任何内容之上而不打断它。音频行为跟普通片段完全一致，只是触发的操作面不同。页眉中
FX 按钮旁的计数器显示此刻正在响的效果数量。

=== 配置效果
<配置效果>
效果分两个层级配置，对应两种不同需求：

- #strong[快速设置] --- jingle machine
  的常见情形：名称、颜色、音量、循环，几秒钟搞定。
- #strong[完整设置] ---
  跟网格片段相同的窗口（波形编辑器、trim、标记、淡变、按键分配），从快速设置里的「完整设置……」进入。

=== pad 的位置
<pad-的位置>
pad 可以停在屏幕左下角或右下角，用 pad
上的箭头设置偏好，各次会话之间会记住。停右侧会盖住 NoteBoard
和最后一列，选哪一侧取决于你怎么排布播出单。

#nota[
MIDI Learn 模式下，点击 pad
的格子会#strong[选中]该效果用于分配，而不是播放它------这样映射控制时不会一不小心把
jingle 送上直播（见第 8 章）。
]

== 7.2 Automix 视图
<automix-视图>
#figure(image("../screenshots-zh-cn/vista-automix.png", alt: "图 7.2 — Automix 视图：Music 列的 deck、BPM 兼容性，以及曲目结束时的自动模式。"),
  caption: [
    图 7.2 --- Automix 视图：Music 列的 deck、BPM
    兼容性，以及曲目结束时的自动模式。
  ]
)

#strong[Automix 视图]是本期歌曲列的 deck：一个全幅界面，由页眉的
#strong[MIX] 按钮唤出，把音乐播出单变成一台 DJ
控制台。它开在看板之上、pad FX 之下，所以 Automix
打开着时效果照样能用。跟 pad 一样，`Esc`
不会关闭它------它仍是紧急命令，STOP ALL 按钮在页眉里随时够得到。

=== deck
中央是#strong[正在播出]的曲目，队列里是本期歌曲列的#strong[下一首]，附带剩余时间。可以从这里启动一条轨道，用一个命令管理曲目间的过渡：那颗大转场按钮用的
crossfade 跟网格里的一样，只是多花了心思做节奏对齐。

=== 兼容性与 beat-matched 转场
<兼容性与-beat-matched-转场>
每首曲目旁都有一个跟前一首的#strong[兼容性圆点]，标出两者的节奏亲和度：

- #strong[绿色] --- 节奏对齐良好，转场可以 beat-matched。
- #strong[黄色] --- 能对齐，但稍打折扣。
- #strong[红色] --- 节奏相差太远，对不齐。

节奏对齐做不到时（没检测到 BPM、beat
不确定、节奏差太多），软件会明说，自动回退到#strong[经典
crossfade]，直播中不会有意外。

=== 自动模式
<自动模式>
视图底部有个#strong[曲目结束时自动]的开关。启用后，正在播出的轨道接近结尾时，RLMP
会自己启动向下一首的过渡。

这个模式是对软件理念的一次刻意例外------RLMP
本来选择不把节目自动化。所以它#strong[默认关闭]，而且#strong[只在
Automix
视图打开时生效]：关掉视图，自动也就停了。它适合连续的音乐段落，比如回到人声之前那半小时的纯音乐，不适合整场直播都开着。
