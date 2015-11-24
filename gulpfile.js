var gulp = require('gulp');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var concat = require("gulp-concat");
var gzip = require("gulp-gzip");
var zip = require("gulp-zip");
var fs = require('fs');
var del = require('del');
var glob = require('glob');
var program = require('commander');
var rename = require('gulp-rename');
var fileConentReplace = require('replace');
var exec = require('child_process').exec;
var seq = require('gulp-run-sequence');
var gulpif = require('gulp-if');

var events = require('events');
events.EventEmitter.prototype._maxListeners = 100

var SRC_PATH = './src';
var TPL_PATH = './my_template';
var OUTPUT_PATH = './output';
var JSLIB_PATH = './libs';
var F2SJS_PATH = './libs/flash2svg';

program
    .version('0.0.1')
    .option('-d, --dir, <dir>', 'dir..')
    .option('-p, --projectName, <projectName>', 'add project name.')
	.option('-s, --source,  <source>', 'use source')
	.option('-i, --pngitems,  <pngitems>', 'change to PNGSpriteSheetItem')
	.option('-g, --pngdep,  <pngdep>', '')
    .parse(process.argv);

/***
 * 建立项目文件
 */
gulp.task('createProjectSrc', function(cb){
	var project = program.projectName,
		projectPath = SRC_PATH + '/' + project,
		pngitems = program.pngitems || '',
		pngdep = program.pngdep || 'true';
	
	if(!project || project === ''){
		console.error('project name is not defined.');
		return;
	}else{
		console.log('start to create project ['+project+']');
	}
	
	del(projectPath);
	
	return gulp.src([
		TPL_PATH+'/manifest.properties.tpl',
		TPL_PATH + '/external-activity.js.tpl',
		TPL_PATH + '/f2s.jsfl.tpl',
		TPL_PATH + '/runf2s.tpl',
		TPL_PATH + '/index.html.tpl',
		TPL_PATH + '/style.css.tpl'
	])
		.pipe(replace(/{{projectName}}/g, project))
		.pipe(replace(/{{PNGSpriteSheetItems}}/g, '"'+pngitems.split(/\s*\,\s*/).join('", "')+'"'))
		.pipe(replace(/{{PNGSpriteSheetForDependent}}/g, pngdep))
		.pipe(rename(function(path){
			if(path.basename === 'external-activity.js'){
				path.dirname += '/libs';
			}else if(path.basename === 'style.css'){
				path.dirname += '/css'
			}
			path.extname = '';
			return path;
		}))
		.pipe(gulp.dest(projectPath));
});
/***
 * 调用 flash app 转化fla为svg
 */
gulp.task('trans', function(cb){
	var project = program.projectName.trim();
	exec('cd src/' + project + ' && osascript runf2s', function(err){
		if(err) cb(err);
		cb();
	});
});

/***
 * 添加系统按钮 > gulp create-buttons -p example -d "reset, play"
 */
gulp.task('buttons', function(cb){
	var dir = program.dir,
        project = program.projectName,
        projectPath = SRC_PATH + '/' + project,
		btnNames = program.source,
		inRow = 4,
		numRow = 0,
		w = 53;
	
	if(!project || project === ''){
		console.error('project name is not defined.');
		cb();
		return;
	}
	if(!btnNames || btnNames === ''){
		console.error('button names is not defined.');
		cb();
		return;
	}
	
	var btnNames = btnNames.split(',');
	var btnTemps = '';
	var width = 0;
	var height = 0;
	var svgTemp = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="none" x="0px" y="0px" width="{{button-width}}px" height="{{button-height}}px" viewBox="0 0 {{button-width}} {{button-height}}">';
	
	btnTemps += svgTemp;
	
	btnNames.forEach(function(name, idx){
		var content = fs.readFileSync(TPL_PATH+'/btn_'+name.trim()+'.tpl', {
			encoding : 'utf-8'
		});
		
		if(!content || content === ''){
			console.warn('template ['+name+'] cound not be found.');
			cb();
			return;
		}
		
		var row = idx % 5;
		var col = Math.ceil((idx + 1) / 5) - 1;
		
		content = content.replace(/{{x}}/g, col * w)
				.replace(/{{y}}/g, row * w);
		
		btnTemps += '\n' + content + '\n';
		
		width = Math.max(width, col * w + w);
		height = Math.max(height, row * w + w);
	});
	
	btnTemps += '</svg>';
	
	btnTemps = btnTemps.replace(/{{button-width}}/g, width + 3)
		.replace(/{{button-height}}/g, height + 3);
	
	fileConentReplace({
		regex: /<!--\s?svg-buttons-begin\s?-->(.|\n)*<!--\s?svg-buttons-end\s?-->/,
		replacement: '<!-- svg-buttons-begin -->\n'+btnTemps+'\n<!-- svg-buttons-end -->',
		paths: [projectPath + '/index.html'],
		recursive: true,
		silent: true
	});
	
	cb();
});

/***
 * 将文件从src移动到output
 */
gulp.task('moveSrc', function(cb){
	var project = program.projectName;
	var projectSrcPath = SRC_PATH + '/' + project;
	var projectOutputPath = OUTPUT_PATH + '/' + project;
	
	console.log('delete project dir in output', projectOutputPath);
	del(projectOutputPath);
	
	return gulp.src([
		projectSrcPath + '/**/*', 
		'!' + projectSrcPath + '/f2s.jsfl', 
		'!' + projectSrcPath + '/runf2s',
		'!' + projectSrcPath + '/index.html'
	]).pipe(gulp.dest(projectOutputPath));
});

gulp.task('moveHtml', function(cb){
	var project = program.projectName;
	var projectSrcPath = SRC_PATH + '/' + project;
	var projectOutputPath = OUTPUT_PATH + '/' + project;
	
	return gulp.src(projectSrcPath + '/index.html')
		.pipe(replace(/<!--\s?flash2svg-start\s?-->(.|\n)*<!--\s?flash2svg-end\s?-->/g, '<script src="libs/flash2svg.min.js" ></script>'))
		.pipe(replace(/\.\.\/\.\.\//g, ''))
		.pipe(gulp.dest(projectOutputPath));
});

gulp.task('moveJS', function(cb){
	var project = program.projectName;
	var projectSrcPath = SRC_PATH + '/' + project;
	var projectOutputPath = OUTPUT_PATH + '/' + project;
	
	return gulp.src([JSLIB_PATH + '/*.js'])
		.pipe(gulpif('presentation-template.js', replace('PROJECT_NAME_PLACEHOLDER', project)))
		.pipe(gulpif('fastclick.js', uglify()))
		.pipe(gulp.dest(projectOutputPath + '/libs'));
});

gulp.task('CompressionF2s', function(cb){
	var project = program.projectName;
	var projectSrcPath = SRC_PATH + '/' + project;
	var projectOutputPath = OUTPUT_PATH + '/' + project;
	
	var f2sarr = [];
	
	var html = fs.readFileSync(projectSrcPath + '/index.html', {
		encoding : 'utf-8'
	});
	 
	var filelinks = html.match(/f2s_[^\/\"\']+\.js/g);
	
	for(var i = 0, len = filelinks.length; i < len; i ++){
		filelinks[i] = F2SJS_PATH + '/' +filelinks[i]; 
	}
	
	return gulp.src(filelinks)
		.pipe(uglify())
		.pipe(concat('flash2svg.min.js'))
		.pipe(gulp.dest(projectOutputPath + '/libs'));
	
});

gulp.task('transSoundFiles', function(cb){
	var project = program.projectName;
	var projectSrcPath = SRC_PATH + '/' + project;
	var srcSoundPath = projectSrcPath + '/sound';
	var commandWAV2MP3 = 'cd ' + srcSoundPath + ' && for file in *.wav; do name=$(echo $file | sed "s/\\.wav//g"); ffmpeg -i "$name".wav -f mp3 -y "$name".mp3; done';
	var commandMP32WAV = 'cd ' + srcSoundPath + ' && for file in *.mp3; do name=$(echo $file | sed "s/\\.mp3//g"); ffmpeg -i "$name".mp3 -f wav -y "$name".wav; done';
	exec(commandWAV2MP3, function(err1){
		if(err1){
			console.log('task::transSoundFiles wav to mp3 failed.');
			cb();
			return;
		}
		exec(commandMP32WAV, function(err2){
			if(err2){
				console.log('task::transSoundFiles mp3 to wav failed.');
				cb();
				return;
			}
			cb();
		})
	});
});

gulp.task('wav2Mp3InConfig', function(cb){
	var project = program.projectName;
	var projectSrcPath = SRC_PATH + '/' + project;
	
	return gulp.src(projectSrcPath + '/libs/config.json')
		.pipe(replace(/\"([^\"]+)\.wav\"/g, function(mat, fname){
			return '"'+fname+'.mp3"';
		}))
		.pipe(gulp.dest(projectSrcPath + '/libs/'));
});

/***
 * 处理音频，转换wav到mp3
 */
gulp.task('transSounds', function(cb){
	return seq(['transSoundFiles', 'wav2Mp3InConfig'], cb);
});

/***
 * 打包
 */
gulp.task('zipProject', function(cb) {
	var project = program.projectName;
	var projectOutputPath = OUTPUT_PATH + '/' + project;
	return gulp.src(projectOutputPath + '/**/*')
		.pipe(zip(project + '.zip'))
		.pipe(gulp.dest(projectOutputPath));
});


gulp.task('create', function(cb){
	return seq('createProjectSrc', 'buttons', 'trans', 'transSounds', cb);
});

gulp.task('build', function(cb){
	return seq('moveSrc', ['moveHtml', 'moveJS', 'CompressionF2s'], 'zipProject', cb);
});

/***
 * 打包要提交的项目 
 */
gulp.task('zipFinished', function(cb){
	var projects = program.projectName;
	if(!projects || projects == ''){
		console.log('miss arg projects...');
		cb();
		return;
	}
	
	var paths = [];
	var p = OUTPUT_PATH;
	var projects = projects.split(/\s*\,\s*/);
	var d = new Date();
	var finished = './finished/' + d.getFullYear()
		 + d.getMonth()
		  + d.getDate()
		   + d.getHours()
		    + d.getMinutes();
	
	projects.forEach(function(value){
		paths.push(p + '/' + value + '/' + value + '.zip');
	});
	
	gulp.src(paths)
		.pipe(rename({'dirname' : ''}))
		.pipe(gulp.dest(finished + '/'))
		.on('end', function(){
			console.log('zip '+finished+' ....');
			gulp.src(finished + '/*.zip')
				.pipe(zip(finished + '.zip'))
				.pipe(rename({'dirname' : ''}))
				.pipe(gulp.dest('finished'))
				.on('end', cb);
		});
	
});
