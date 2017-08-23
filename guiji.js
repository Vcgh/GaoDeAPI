    AMapUI.load(['ui/misc/PathSimplifier', 'lib/$', 'lib/utils'], function(PathSimplifier, $, utils) {

        if (!PathSimplifier.supportCanvas) {
            alert('当前环境不支持 Canvas！');
            return;
        }

        var defaultRenderOptions = {
            pathNavigatorStyle: {
                width: 16,
                height: 16,
                autoRotate: true,
                lineJoin: 'round',
                content: 'defaultPathNavigator',
                fillStyle: '#087EC4',
                strokeStyle: '#116394', //'#eeeeee',
                lineWidth: 1,
                pathLinePassedStyle: {
                    lineWidth: 2,
                    strokeStyle: 'rgba(8, 126, 196, 1)',
                    borderWidth: 1,
                    borderStyle: '#eeeeee',
                    dirArrowStyle: false
                }
            }
        };

        var pathSimplifierIns = new PathSimplifier({

            zIndex: 100,

            map: map,

            getPath: function(pathData, pathIndex) {

                return pathData.path;
            },
            getHoverTitle: function(pathData, pathIndex, pointIndex) {

                if (pointIndex >= 0) {
                    //point 
                    return pathData.name + '，点:' + pointIndex + '/' + pathData.path.length;
                }

                return pathData.name + '，点数量' + pathData.path.length;
            },
            renderOptions: defaultRenderOptions
        });

        window.pathSimplifierIns = pathSimplifierIns;


        pathSimplifierIns.setData([{
            name: 'Test',
            path: PathSimplifier.getGeodesicPath([121.541000, 31.221359],[121.552000, 31.232600],[121.548799, 31.219316], 300)
        }]);

        pathSimplifierIns.setSelectedPathIndex(0);


        var navg = pathSimplifierIns.createPathNavigator(0, {

            loop: true,
            speed: 500,
            pathNavigatorStyle: {
                //content: 'none'
            }
        });

        navg.start();

        var customContainer = document.getElementById('my-gui-container');

        function createKeyNavigatorStyleGui(target) {

            var keyNavigatorStyleGui = new dat.GUI({
                width: 260,
                autoPlace: false,
            });

            var keyNavigatorStyleParams = utils.extend({}, defaultRenderOptions[target]);

            //形状类型
            keyNavigatorStyleGui.add(keyNavigatorStyleParams,
                'content', ['defaultPathNavigator', 'defaultArrow', 'plane_icon', 'circle', 'none']).onChange(render);


            keyNavigatorStyleGui.add(keyNavigatorStyleParams, 'autoRotate').onChange(render);

            keyNavigatorStyleGui.add(keyNavigatorStyleParams, 'width', 10, 50).step(1).onChange(render);

            keyNavigatorStyleGui.add(keyNavigatorStyleParams, 'height', 10, 50).step(1).onChange(render);

            keyNavigatorStyleGui.addColor(keyNavigatorStyleParams, 'fillStyle').onChange(render);

            keyNavigatorStyleGui.addColor(keyNavigatorStyleParams, 'strokeStyle').onChange(render);

            keyNavigatorStyleGui.add(keyNavigatorStyleParams, 'lineWidth', 1, 20).step(1).onChange(render);

            addGuiPanel(target, target, keyNavigatorStyleGui);

            return keyNavigatorStyleParams;
        }

        function createPathLineStyleGui(target) {

            var pathLineStyleGui = new dat.GUI({
                width: 260,
                autoPlace: false,
            });

            var parts = target.split('.');

            var pathLineStyleParams = utils.extend({}, defaultRenderOptions[parts[0]][parts[1]]);

            pathLineStyleGui.addColor(pathLineStyleParams, 'strokeStyle').onChange(render);

            pathLineStyleGui.add(pathLineStyleParams, 'lineWidth', 1, 20).step(1).onChange(render);

            pathLineStyleGui.addColor(pathLineStyleParams, 'borderStyle').onChange(render);

            pathLineStyleGui.add(pathLineStyleParams, 'borderWidth', 1, 20).step(1).onChange(render);

            pathLineStyleGui.add(pathLineStyleParams, 'dirArrowStyle').onChange(render);

            addGuiPanel(target, target, pathLineStyleGui);

            return pathLineStyleParams;
        }

        function addGuiPanel(id, title, gui) {

            var container = document.createElement('div');

            container.id = id;

            if (title) {
                var tEle = document.createElement('h3');
                tEle.innerHTML = title;
                container.appendChild(tEle);
            }

            container.appendChild(gui.domElement);

            customContainer.appendChild(container);
        }

        var keyNavigatorStyleOptions = ['pathNavigatorStyle'],
            pathLineStyleOptions = ['pathNavigatorStyle.pathLinePassedStyle'];


        var styleParamsMap = {};

        for (var i = 0, len = keyNavigatorStyleOptions.length; i < len; i++) {
            styleParamsMap[keyNavigatorStyleOptions[i]] = createKeyNavigatorStyleGui(keyNavigatorStyleOptions[i]);
        }

        for (var i = 0, len = pathLineStyleOptions.length; i < len; i++) {
            styleParamsMap[pathLineStyleOptions[i]] = createPathLineStyleGui(pathLineStyleOptions[i]);
        }



        var customContentMap = {
            'plane_icon': function(params) {

                return utils.extend(params, {
                    //使用图片
                    content: PathSimplifier.Render.Canvas.getImageContent(
                        './imgs/plane.png',
                        function onload() {
                            pathSimplifierIns.renderLater();
                        },
                        function onerror(e) {
                            alert('图片加载失败！');
                        })
                });
            }
        };


        function getStyleParams() {

            var params = utils.extend({}, styleParamsMap['pathNavigatorStyle']);

            params = fixColors(params);

            if (params['content'] && customContentMap[params['content']]) {
                params = customContentMap[params['content']](params);
            }

            params.pathLinePassedStyle = utils.extend({}, styleParamsMap['pathNavigatorStyle.pathLinePassedStyle']);

            params.pathLinePassedStyle = fixColors(params.pathLinePassedStyle);

            return {
                pathNavigatorStyle: params
            };
        }

        var colorFlds = ['fillStyle', 'strokeStyle', 'borderStyle'],
            rgbAlphaRegx = /([\d\.]+)\s*\)/i;

        function isEmptyColor(color) {

            if (color.indexOf('rgba') !== 0) {
                return false;
            }

            var match = color.match(rgbAlphaRegx);

            if (match && parseFloat(match[1]) < 0.01) {
                return true;
            }

            return false;
        }

        function fixColors(opts) {

            if (utils.isObject(opts)) {

                for (var i = 0, len = colorFlds.length; i < len; i++) {

                    if (opts[colorFlds[i]] && isEmptyColor(opts[colorFlds[i]])) {
                        opts[colorFlds[i]] = null;
                    }
                }
            }

            return opts;
        }

        function render() {

            pathSimplifierIns.renderEngine.setOptions(getStyleParams());

            pathSimplifierIns.renderLater(200);

            refreshConfigPanel();
        }


        function exportRenderOptions() {

            var options = getStyleParams();

            return options;
        }

        function refreshConfigPanel() {

            var options = exportRenderOptions();

            var configStr = 'renderOptions: ' + JSON.stringify(options, null, 2);

            $('#exportConfigPanel').find('pre').html(configStr);
        }

        $('#exportBtn').click(function() {

            var panel = $('#exportConfigPanel');

            if (!panel.length) {
                panel = $('<div id="exportConfigPanel"><pre></pre></div>').appendTo(document.body);
                $(this).html('隐藏配置信息');

            } else {
                $(this).html('显示配置信息');
                panel.remove();
                return;
            }
            refreshConfigPanel();
        });

        render();
    });