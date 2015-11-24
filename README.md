新建项目 -p 项目名 -s 系统按钮名
1. 在./data目录放置项目同名.fla文件
2. 执行gulp create -p projectname -s [reset, play]

打包项目 -p 项目名
1. 保证已经建立项目在./src目录
2. 执行gulp build -p projectname

添加按钮 -p 项目名 -s 系统按钮名（create任务包含此任务）
1. 执行gulp buttons -p projectname -s [reset, play]

在output中将.wav转换成.mp3，同时更新config.json文件（build任务包含此任务）
1. 安装ffmpeg，执行 brew install ffmpeg
2. 执行 gulp transSound -p projectname



