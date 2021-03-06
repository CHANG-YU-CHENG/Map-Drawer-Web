var map;
var raster;
var featureOverlay;
var popup_overlay;
var features;
var modify;
var want_modify_feature;
var typeSelect

var measure;
/**
* Currently drawn feature.
* @type {ol.Feature}
*/
var sketch;
/**
* The help tooltip element.
* @type {Element}
*/
var helpTooltipElement;
/**
* Overlay to show the help messages.
* @type {ol.Overlay}
*/
var helpTooltip;
/**
* The measure tooltip element.
* @type {Element}
*/
var measureTooltipElement;

/**
* Overlay to show the measurement.
* @type {ol.Overlay}
*/
var measureTooltip;
var wgs84Sphere = new ol.Sphere(6378137);
var measure_draw;
var source = new ol.source.Vector();

$(document).ready(function () {

    /********* component init ***********/
    $('#show_hide_draw_menu').click(function () {
        $('.ui.accordion').toggle();
    });

    $('.ui.accordion').accordion({
        onOpen: function () {
            if ($(this).index(".content") == 0) {
                // fix prpblem when add text, edit text then add text again
                // init again
                switch($(this).index(".tab")){
                    case 1:
                        // the ranger wont display until tab index 1 is clicked
                        // so if ranger init at first, the function wont work
                        $("#point_arc_ranger").range({
                            min: -90,
                            max: 90,
                            start: 0,
                            step: 30,
                            onChange: function(value) {
                                $("#point_text_arc").html(value);
                                $("#point_text_arc").trigger('input');
                            }
                        });
                        break;
                    case 2:
                        $('#line_arc_ranger').range({
                            min: -90,
                            max: 90,
                            start: 0,
                            step: 30,
                            onChange: function(value) {
                                $("#line_text_arc").html(value);
                                $("#line_text_arc").trigger('input');
                            }
                        });
                        break;
                    case 3:
                        $('#poly_arc_ranger').range({
                            min: -90,
                            max: 90,
                            start: 0,
                            step: 30,
                            onChange: function(value) {
                                $("#poly_text_arc").html(value);
                                $("#poly_text_arc").trigger('input');
                            }
                        });
                        break;
                }
            }
        }
    });

    $('.secondary.menu > .item').tab({
        onVisible: function() {
            // the ranger wont display until tab index 1 is clicked
            // so if ranger init at first, the function wont work
            switch($(this).index(".tab")){
                case 1:
                    $("#point_arc_ranger").range({
                        min: -90,
                        max: 90,
                        start: 0,
                        step: 30,
                        onChange: function(value) {
                            $("#point_text_arc").html(value);
                            $("#point_text_arc").trigger('input');
                        }
                    });
                    break;
                case 2:
                    $('#line_arc_ranger').range({
                        min: -90,
                        max: 90,
                        start: 0,
                        step: 30,
                        onChange: function(value) {
                            $("#line_text_arc").html(value);
                            $("#line_text_arc").trigger('input');
                        }
                    });
                    break;
                case 3:
                    $('#poly_arc_ranger').range({
                        min: -90,
                        max: 90,
                        start: 0,
                        step: 30,
                        onChange: function(value) {
                            $("#poly_text_arc").html(value);
                            $("#poly_text_arc").trigger('input');
                        }
                    });
                    break;
            }
        }
    });

    $(".color_picker").spectrum({
        preferredFormat: "hex",
        color: "#000000",
        showPaletteOnly: true,
        showPalette:true,
        hideAfterPaletteSelect:true,
        palette: [
            ['#000000', 'white', '#76060C',
            'rgb(255, 128, 0);', 'hsv 100 70 50'],
            ['red', '#660066', 'green', 'blue', 'violet']
        ],
        hide: function(color) {
            $(this).parent().children('input').trigger("input");
        }
    });
    /********* !component init ***********/

    /*************** editor popup **************/
    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');

    /**
    * Create an overlay to anchor the popup to the map.
    */
    popup_overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ {
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
    });

    /**
    * Add a click handler to hide the popup.
    * @return {boolean} Don't follow the href.
    */
    closer.onclick = function() {
        var feature_id = $('#update').siblings("#popup-content").children("div").first().text();
        var feature = featureOverlay.getSource().getFeatureById(feature_id);
        want_modify_feature.remove(feature);

        popup_overlay.setPosition(undefined);
        content.innerHTML = "";
        closer.blur();
        return false;
    };
    /*************** !editor popup **************/

    /************ map init *************/
    raster = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    features = new ol.Collection();
    //sync feature
    featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector({features: features}),
    });


    map = new ol.Map({
        layers: [raster, featureOverlay],
        overlays: [popup_overlay],
        target: 'map',
        view: new ol.View({
            center: ol.proj.transform([120.594013,23.267667], 'EPSG:4326', 'EPSG:3857'),
            zoom: 8
        })
    });

    want_modify_feature = new ol.Collection();
    modify = new ol.interaction.Modify({
        features: want_modify_feature,
        // the SHIFT key must be pressed to delete vertices, so
        // that new vertices can be drawn at the same position
        // of existing vertices
        deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
        }
    });
    map.addInteraction(modify);

    document.getElementById('export-png').addEventListener('click', function() {
        map.once('postcompose', function(event) {
            var canvas = event.context.canvas;
            event.context.textAlign = 'right';
            event.context.fillText('© My Copyright Text', canvas.width -100, canvas.height - 100);
            event.context.fillText('© My Copyright Text', canvas.width - 5, canvas.height - 5);
            
            canvas_url = canvas.toDataURL();
            console.log(canvas_url);

            var doc = new jsPDF();
            //var imgData = 'data:image/png;base64,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'
            doc.text('Hello world!', 10,10);
            doc.addImage(canvas_url, 'PNG', 15, 40, 180, 160, null, 'FAST');
            doc.save('a4.pdf');
            //event.context.fillText('', canvas.width -100, canvas.height - 100);
            //event.context.fillText('', canvas.width - 5, canvas.height - 5);
        });
        map.renderSync();
        map.addControl(new ol.control.Zoom({
            className: 'custom-zoom'
        }));
    
    });
    /************ !map init *************/

    /************ menu button listener ***********/
    $('.secondary.menu > a.item').on('click', function() {
        if( $(this).data("tab") === "one" ){
            map_move_mode();
        }
        else if( $(this).data("tab") === "five"){ //measure on change
            measure_start();
        }
    });


    $('#point_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawIconText();
    });
    $("#point_text_size, input[name='point_icon']").change(function () {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawIconText();
    });
    $("#point_text_color, #point_text_content, #point_text_arc").on('input', function() {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawIconText();
    });


    $('#line_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawLine();
    });
    $("#line_text_size, #line_size").change(function () {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawLine();
    });
    $("#line_text_color, #line_color, #line_text_content, #line_text_arc").on('input', function() {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawLine();
    });


    $('#poly_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawPolygon();
    });
    $("#poly_text_size, #poly_size, #poly_border_size").change(function () {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawPolygon();
    });
    $("#poly_text_color, #poly_line_color, #poly_color, #poly_text_content, #poly_text_arc").on('input', function() {
        map.removeInteraction(draw); // remove old brush
        map.removeInteraction(measure_draw);
        clear_helptooltip();
        drawPolygon();
    });


    /*$('#measure_button').click(function(){
        measure_start();
    })*/

    $(document).on('click', '.search.button', function () {
        var feature_id = $(this).parent().siblings("td").first().children("div").text();
        if (feature_id.split(' ')[0] == "line") {
            map.getView().setCenter(
                featureOverlay.getSource().getFeatureById(feature_id).getGeometry().getCoordinates()[0]
            );
        }else if(feature_id.split(' ')[0] == "polygon"){
            map.getView().setCenter(
                featureOverlay.getSource().getFeatureById(feature_id).getGeometry().getCoordinates()[0][0]
            );
        }else{
            map.getView().setCenter(
                featureOverlay.getSource().getFeatureById(feature_id).getGeometry().getCoordinates()
            );
        }
        map.getView().setZoom(10);
    });

    $(document).on('click', '.edit.button', function () {
        var feature_id = $(this).parent().siblings("td").first().children("div").text();
        var feature = featureOverlay.getSource().getFeatureById(feature_id);
        if (feature_id.split(' ')[0] == "polygon") {
            var coord = feature.getGeometry().getCoordinates()[0][0];
        }else if(feature_id.split(' ')[0] == "line"){
            var coord = feature.getGeometry().getCoordinates()[0];
        }else{
            var coord = feature.getGeometry().getCoordinates();
        }
        coord[1] += 0.1;
        popup_overlay.setPosition(coord);

        want_modify_feature.push(feature);

        var type = $(this).parent().siblings("td:nth-child(2)").children("i").attr('class');
        switch(type){
            case 'font icon':
            case 'home icon':
            case 'h icon':
            case 'warning sign icon':
                var text_style = feature.getStyle().getText();
                var text_size = text_style.getScale();
                if (feature.getStyle().getImage().getImage().toString().indexOf("Image") != -1) {
                    var img = feature.getStyle().getImage().getSrc();
                }else{
                    var img = "none";
                }

                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>字體大小</label>" +
                                "<select id='update_text_size'>" +
                                    "<option value='1' " + ((text_size == 1)? "selected='selected'" : "") + ">1</option>" +
                                    "<option value='1.3' " + ((text_size == 1.3)? "selected='selected'" : "") + ">1.3</option>" +
                                    "<option value='1.7' " + ((text_size == 1.7)? "selected='selected'" : "") + ">1.7</option>" +
                                    "<option value='2' " + ((text_size == 2)? "selected='selected'" : "") + ">2</option>" +
                                    "<option value='2.3' " + ((text_size == 2.3)? "selected='selected'" : "") + ">2.3</option>" +
                                    "<option value='2.7' " + ((text_size == 2.7)? "selected='selected'" : "") + ">2.7</option>" +
                                    "<option value='3' " + ((text_size == 3)? "selected='selected'" : "") + ">3</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>字顏色</label>" +
                                "<input type='text' id='update_text_color_picker' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>內容</label>" +
                            "<input type='text' id='update_text_content' value='" + text_style.getText() + "'/>" +
                        "</div>" +
                        "<div class='fields'>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "none")? "checked='checked'" : "") + " value='none' tabindex='0'>" +
                                "<p>無圖示</p>" +
                            "</div>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "img/marker01.png")? "checked='checked'" : "") + " value='img/marker01.png' tabindex='0'>" +
                                "<img class='ui small image' src='img/marker01.png'>" +
                            "</div>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "img/marker02.png")? "checked='checked'" : "") + " value='img/marker02.png' tabindex='0'>" +
                                "<img class='ui small image' src='img/marker02.png'>" +
                            "</div>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "img/marker03.png")? "checked='checked'" : "") + " value='img/marker03.png' tabindex='0'>" +
                                "<img class='ui small image' src='img/marker03.png'>" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>字角度：<span id='update_text_arc'></span></label>" +
                            "<div class='ui brown range'></div>" +
                        "</div>" +
                    "</div>";

                $("#update_text_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: text_style.getFill().getColor(),
                    showPaletteOnly: true,
                    showPalette:true,
                    hideAfterPaletteSelect:true,
                    palette: [
                        ['black', 'white', '#76060C',
                        'rgb(255, 128, 0);', 'hsv 100 70 50'],
                        ['red', '#660066', 'green', 'blue', 'violet']
                    ],
                    hide: function(color) {
                        update_feature();
                    }
                });

                $('.ui.range').range({
                    min: -90,
                    max: 90,
                    start: parseInt((text_style.getRotation() * 180) / Math.PI),
                    step: 30,
                    onChange: function(value) {
                        $('#update_text_arc').html(value);
                        console.log("sdljfs");
                        update_feature();
                    }
                });
                break;

            case 'arrow left icon':
                var text_style = feature.getStyle().getText();
                var text_size = text_style.getScale();
                var line_style = feature.getStyle().getStroke();
                var line_width = parseInt(line_style.getWidth());

                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>字體大小</label>" +
                                "<select id='update_text_size'>" +
                                    "<option value='1' " + ((text_size == 1)? "selected='selected'" : "") + ">1</option>" +
                                    "<option value='1.3' " + ((text_size == 1.3)? "selected='selected'" : "") + ">1.3</option>" +
                                    "<option value='1.7' " + ((text_size == 1.7)? "selected='selected'" : "") + ">1.7</option>" +
                                    "<option value='2' " + ((text_size == 2)? "selected='selected'" : "") + ">2</option>" +
                                    "<option value='2.3' " + ((text_size == 2.3)? "selected='selected'" : "") + ">2.3</option>" +
                                    "<option value='2.7' " + ((text_size == 2.7)? "selected='selected'" : "") + ">2.7</option>" +
                                    "<option value='3' " + ((text_size == 3)? "selected='selected'" : "") + ">3</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>字顏色</label>" +
                                "<input type='text' id='update_text_color_picker' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>內容</label>" +
                            "<input type='text' id='update_text_content' value='" + text_style.getText() + "'/>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>字角度：<span id='update_text_arc'></span></label>" +
                            "<div class='ui brown range'></div>" +
                        "</div>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>線寬</label>" +
                                "<select id='update_line_size'>" +
                                    "<option value='8' " + ((line_width == 8)? "selected='selected'" : "") + ">8</option>" +
                                    "<option value='9' " + ((line_width == 9)? "selected='selected'" : "") + ">9</option>" +
                                    "<option value='10' " + ((line_width == 10)? "selected='selected'" : "") + ">10</option>" +
                                    "<option value='11' " + ((line_width == 11)? "selected='selected'" : "") + ">11</option>" +
                                    "<option value='12' " + ((line_width == 12)? "selected='selected'" : "") + ">12</option>" +
                                    "<option value='13' " + ((line_width == 13)? "selected='selected'" : "") + ">13</option>" +
                                    "<option value='20' " + ((line_width == 20)? "selected='selected'" : "") + ">20</option>" +
                                    "<option value='40' " + ((line_width == 40)? "selected='selected'" : "") + ">40</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>線顏色</label>" +
                                "<input type='text' id='update_line_color_picker' />" +
                            "</div>" +
                        "</div>" +
                    "</div>";
                $("#update_text_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: text_style.getFill().getColor(),
                    showPaletteOnly: true,
                    showPalette:true,
                    hideAfterPaletteSelect:true,
                    palette: [
                        ['black', 'white', '#76060C',
                        'rgb(255, 128, 0);', 'hsv 100 70 50'],
                        ['red', '#660066', 'green', 'blue', 'violet']
                    ],
                    hide: function(color) {
                        update_feature();
                    }
                });
                $("#update_line_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: line_style.getColor(),
                    showPaletteOnly: true,
                    showPalette:true,
                    hideAfterPaletteSelect:true,
                    palette: [
                        ['black', 'white', '#76060C',
                        'rgb(255, 128, 0);', 'hsv 100 70 50'],
                        ['red', '#660066', 'green', 'blue', 'violet']
                    ],
                    hide: function(color) {
                        update_feature();
                    }
                });

                $('.ui.range').range({
                    min: -90,
                    max: 90,
                    start: parseInt((text_style.getRotation() * 180) / Math.PI),
                    step: 30,
                    onChange: function(value) {
                        $('#update_text_arc').html(value);
                        update_feature();
                    }
                });
                break;

            case 'square outline icon':
                var text_style = feature.getStyle().getText();
                var text_size = text_style.getScale();
                var line_style = feature.getStyle().getStroke();
                var line_width = parseInt(line_style.getWidth());
                var fill_color = feature.getStyle().getFill().getColor();
                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>字體大小</label>" +
                                "<select id='update_text_size'>" +
                                    "<option value='1' " + ((text_size == 1)? "selected='selected'" : "") + ">1</option>" +
                                    "<option value='1.3' " + ((text_size == 1.3)? "selected='selected'" : "") + ">1.3</option>" +
                                    "<option value='1.7' " + ((text_size == 1.7)? "selected='selected'" : "") + ">1.7</option>" +
                                    "<option value='2' " + ((text_size == 2)? "selected='selected'" : "") + ">2</option>" +
                                    "<option value='2.3' " + ((text_size == 2.3)? "selected='selected'" : "") + ">2.3</option>" +
                                    "<option value='2.7' " + ((text_size == 2.7)? "selected='selected'" : "") + ">2.7</option>" +
                                    "<option value='3' " + ((text_size == 3)? "selected='selected'" : "") + ">3</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>字顏色</label>" +
                                "<input type='text' id='update_text_color_picker' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>內容</label>" +
                            "<input type='text' id='update_text_content' value='" + text_style.getText() + "' />" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>字角度：<span id='update_text_arc'></span></label>" +
                            "<div class='ui brown range' id='update_arc_ranger'></div>" +
                        "</div>" +
                        "<div class='fields'>" +
                            "<div class='field'>" +
                                "<label>邊寬</label>" +
                                "<select id='update_border_size'>" +
                                    "<option value='8' " + ((line_width == 8)? "selected='selected'" : "") + ">8</option>" +
                                    "<option value='9' " + ((line_width == 9)? "selected='selected'" : "") + ">9</option>" +
                                    "<option value='10' " + ((line_width == 10)? "selected='selected'" : "") + ">10</option>" +
                                    "<option value='11' " + ((line_width == 11)? "selected='selected'" : "") + ">11</option>" +
                                    "<option value='12' " + ((line_width == 12)? "selected='selected'" : "") + ">12</option>" +
                                    "<option value='13' " + ((line_width == 13)? "selected='selected'" : "") + ">13</option>" +
                                    "<option value='20' " + ((line_width == 20)? "selected='selected'" : "") + ">20</option>" +
                                    "<option value='40' " + ((line_width == 40)? "selected='selected'" : "") + ">40</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='five wide field'>" +
                                "<label>邊框顏色</label>" +
                                "<input type='text' id='update_border_color_picker' />" +
                            "</div>" +
                            "<div class='field'>" +
                                "<label>多邊形顏色</label>" +
                                "<input type='text' id='update_poly_color_picker' />" +
                            "</div>" +
                        "</div>" +
                    "</div>";
                $("#update_text_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: text_style.getFill().getColor(),
                    showPaletteOnly: true,
                    showPalette:true,
                    hideAfterPaletteSelect:true,
                    palette: [
                        ['black', 'white', '#76060C',
                        'rgb(255, 128, 0);', 'hsv 100 70 50'],
                        ['red', '#660066', 'green', 'blue', 'violet']
                    ],
                    hide: function(color) {
                        update_feature();
                    }
                });
                $("#update_border_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: line_style.getColor(),
                    showPaletteOnly: true,
                    showPalette:true,
                    hideAfterPaletteSelect:true,
                    palette: [
                        ['black', 'white', '#76060C',
                        'rgb(255, 128, 0);', 'hsv 100 70 50'],
                        ['red', '#660066', 'green', 'blue', 'violet']
                    ],
                    hide: function(color) {
                        update_feature();
                    }
                });
                $("#update_poly_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: fill_color,
                    showPaletteOnly: true,
                    showPalette:true,
                    hideAfterPaletteSelect:true,
                    palette: [
                        ['black', 'white', '#76060C',
                        'rgb(255, 128, 0);', 'hsv 100 70 50'],
                        ['red', '#660066', 'green', 'blue', 'violet']
                    ],
                    hide: function(color) {
                        update_feature();
                    }
                });

                $('.ui.range').range({
                    min: -90,
                    max: 90,
                    start: parseInt((text_style.getRotation() * 180) / Math.PI),
                    step: 30,
                    onChange: function(value) {
                        $('#update_text_arc').html(value);
                        update_feature();
                    }
                });
                break;
        }
    });
    $(document).on('change', "#update_text_size,#update_line_size,#update_border_size,input[name='update_point_icon']", function () {
        update_feature();
    });
    $(document).on('input', '#update_text_content', function () {
        update_feature();
    });

    $(document).on('click', '.remove.button', function () {
        var feature_id = $(this).parent().siblings("td").first().children("div").text();
        featureOverlay.getSource().removeFeature( featureOverlay.getSource().getFeatureById(feature_id) );
        $(this).parent().parent().remove();
    });
    /************ !menu button listener ***********/

    /*************** measure *************/

    typeSelect = document.getElementById('type');

    /**
    * Let user change the geometry type.
    */
    typeSelect.onchange = function() {
        map.removeInteraction(measure_draw);
        //addInteraction();
        measure_start();
    };

    //ypeSelect = document.getElementById('type');

    function measure_start(){

        map.removeInteraction(draw);
        map.removeInteraction(measure_draw);

        measure = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

      /**
      * Message to show when the user is drawing a polygon.
      * @type {string}
      */
      var continuePolygonMsg = 'Click to continue drawing the polygon';

      /**
      * Message to show when the user is drawing a line.
      * @type {string}
      */
      var continueLineMsg = 'Click to continue drawing the line';

      /**
      * Handle pointer move.
      * @param {ol.MapBrowserEvent} evt The event.
      */
      createMeasureTooltip();
      createHelpTooltip();

      var pointerMoveHandler = function(evt) {
        if (evt.dragging) {
          return;
        }
        /** @type {string} */
        var helpMsg = 'Click to start drawing';

        if (sketch) {
          var geom = (sketch.getGeometry());
          if (geom instanceof ol.geom.Polygon) {
            helpMsg = continuePolygonMsg;
          } else if (geom instanceof ol.geom.LineString) {
            helpMsg = continueLineMsg;
          }
        }

        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);

        helpTooltipElement.classList.remove('hidden');
      };

      map.on('pointermove', pointerMoveHandler);

      map.getViewport().addEventListener('mouseout', function() {
        helpTooltipElement.classList.add('hidden');
      });

      map.addLayer(measure);
      addInteraction();
    };
    //addInteraction();

    // 清除measure圖層與tooltip
    $('#measure_clean').click(function () {
        measure_clean();
    });

    /*************** !measure *************/

});

function update_feature() {
    var feature_id = $('#update').siblings("#popup-content").children("div").first().text();
    var feature = featureOverlay.getSource().getFeatureById(feature_id);
    want_modify_feature.remove(feature);
    console.log((feature_id.split(' '))[0]);

    switch((feature_id.split(' '))[0]){
        case 'font':
        case 'home':
        case 'h':
        case 'warning_sign':
            console.log($('#update_text_color_picker').val());
            var text_style = feature.getStyle().getText();
            var new_style = new ol.style.Style({
                image: (($("input[name=update_point_icon]:checked").val()=="none")?
                            new ol.style.Circle({
                                radius: 0,
                                fill: new ol.style.Fill({ color: "rgba(0,0,0,0)",})
                            }) :
                            new ol.style.Icon({
                                anchor: [0.5, 46],
                                anchorXUnits: 'fraction',
                                anchorYUnits: 'pixels',
                                scale: 1,
                                src: $("input[name=update_point_icon]:checked").val(),
                            })),
                stroke: new ol.style.Stroke({
                    color: "rgba(0,0,0,0)",
                    width: 0,
                }),
                fill: new ol.style.Fill({
                    color: "rgba(0,0,0,0)",
                }),
                text: new ol.style.Text({
                    font: "Microsoft Yahei,sans-serif",
                    scale: parseFloat($('#update_text_size').val()),
                    fill: new ol.style.Fill({ color: ($('#update_text_color_picker').val()=="")? text_style.getFill().getColor() : $('#update_text_color_picker').val() }),
                    stroke: new ol.style.Stroke({color: '#660066', width: 1}),
                    rotation: parseInt($('#update_text_arc').text())*Math.PI/180,
                    text: $('#update_text_content').val(),
                    offsetY: -10
                })
            });
            feature.setStyle(new_style);
            break;
        case 'line':
            var text_style = feature.getStyle().getText();
            var line_style = feature.getStyle().getStroke();
            var new_style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 0,
                    fill: new ol.style.Fill({ color: "rgba(0,0,0,0)",})
                }) ,
                stroke: new ol.style.Stroke({
                    color: (($('#update_line_color_picker').val()=="")? line_style.getColor() : $('#update_line_color_picker').val()),
                    width: parseInt($('#update_line_size').val()),
                }),
                fill: new ol.style.Fill({
                    color: "rgba(0,0,0,0)",
                }),
                text: new ol.style.Text({
                    font: "Microsoft Yahei,sans-serif",
                    scale: parseFloat($('#update_text_size').val()),
                    fill: new ol.style.Fill({ color: ($('#update_text_color_picker').val()=="")? text_style.getFill().getColor() : $('#update_text_color_picker').val() }),
                    stroke: new ol.style.Stroke({color: '#660066', width: 1}),
                    rotation: parseInt($('#update_text_arc').text())*Math.PI/180,
                    text: $('#update_text_content').val(),
                    offsetY: -10
                })
            });
            feature.setStyle(new_style);
            break;
        case 'polygon':
            var text_style = feature.getStyle().getText();
            var line_style = feature.getStyle().getStroke();
            var poly_color = feature.getStyle().getFill().getColor();
            var new_style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 0,
                    fill: new ol.style.Fill({ color: "rgba(0,0,0,0)",})
                }),
                stroke: new ol.style.Stroke({
                    color: (($('#update_border_color_picker').val()=="")? line_style.getColor() : $('#update_border_color_picker').val()),
                    width: parseInt($('#update_border_size').val()),
                }),
                fill: new ol.style.Fill({
                    color: (($('#update_poly_color_picker').val()=="")? poly_color : hexToRgbA($('#update_poly_color_picker').val())),
                }),
                text: new ol.style.Text({
                    font: "Microsoft Yahei,sans-serif",
                    scale: parseFloat($('#update_text_size').val()),
                    fill: new ol.style.Fill({ color: ($('#update_text_color_picker').val()=="")? text_style.getFill().getColor() : $('#update_text_color_picker').val() }),
                    stroke: new ol.style.Stroke({color: '#660066', width: 1}),
                    rotation: parseInt($('#update_text_arc').text())*Math.PI/180,
                    text: $('#update_text_content').val(),
                    offsetY: -10
                })
            });
            feature.setStyle(new_style);
            break;
    }

    // update edit icon
    for(i=0 ; i<$("#editor > tbody > tr > td:first-child > div").length ; i++){
        if($($("#editor > tbody > tr > td:first-child > div")[i]).text() == feature_id){
            if ((feature_id.split(' '))[0] == "line")
                $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='arrow left icon'></i>(" + $('#update_text_content').val() + ")");
            else if ((feature_id.split(' '))[0] == "polygon")
                $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='square outline icon'></i>(" + $('#update_text_content').val() + ")");
            else  // point
                switch($("input[name=update_point_icon]:checked").val()){
                    case 'none':
                        $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='font icon'></i>(" + $('#update_text_content').val() + ")");
                        $($("#editor > tbody > tr > td:first-child > div")[i]).text("font " + (feature_id.split(' '))[1]);
                        feature.setId("font " + (feature_id.split(' '))[1]);
                        $('#popup > #popup-content > div:first-child').text("font " + (feature_id.split(' '))[1]);
                        break;
                    case 'img/marker01.png':
                        $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='home icon'></i>(" + $('#update_text_content').val() + ")");
                        $($("#editor > tbody > tr > td:first-child > div")[i]).text("home " + (feature_id.split(' '))[1]);
                        feature.setId("home " + (feature_id.split(' '))[1]);
                        $('#popup > #popup-content > div:first-child').text("home " + (feature_id.split(' '))[1]);
                        break;
                    case 'img/marker02.png':
                        $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='h icon'></i>(" + $('#update_text_content').val() + ")");
                        $($("#editor > tbody > tr > td:first-child > div")[i]).text("h " + (feature_id.split(' '))[1]);
                        feature.setId("h " + (feature_id.split(' '))[1]);
                        $('#popup > #popup-content > div:first-child').text("h " + (feature_id.split(' '))[1]);
                        break;
                    case 'img/marker03.png':
                        $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='warning sign icon'></i>(" + $('#update_text_content').val() + ")");
                        $($("#editor > tbody > tr > td:first-child > div")[i]).text("warning_sign " + (feature_id.split(' '))[1]);
                        feature.setId("warning_sign " + (feature_id.split(' '))[1]);
                        $('#popup > #popup-content > div:first-child').text("warning_sign " + (feature_id.split(' '))[1]);
                        break;
                }
            break;
        }
    }

    //document.getElementById('popup-closer').onclick();
}


// transfer kml color code "abgr" to normal hex color code "#rgb"
function kmlColorCodeToHex(code){
    var r = code[6]+code[7];
    var g = code[4]+code[5];
    var b = code[2]+code[3];
    return "#"+r+g+b;
}
// global variable
var draw;
var type;
var point_color;
var point_radius;
var line_color;
var line_width;
var plane_color;
var text_content;
var text_size;
var text_color;
var text_rotation;
var icon_url;
var isIcon;
var brush = false;
var is_measure = false;


// set default features to prevent some error
function setDefaultFeatures(){
    type = "Point";
    point_color = "rgba(0, 0, 0, 0)";
    point_radius = 0;
    line_color = "rgba(0, 0, 0, 0)";
    line_width = 0;
    plane_color = "rgba(0, 0, 0, 0)";
    text_content = "";
    text_size = 1;
    text_color = "rgba(0, 0, 0, 0)";
    text_rotation = 0;
    icon_url = "https://openlayers.org/en/v4.1.1/examples/data/icon.png";
    isIcon = false;
}

function map_move_mode(){
    //關掉畫圖與測量
    map.removeInteraction(draw);
    map.removeInteraction(measure_draw);

    clear_helptooltip();

    //interaction = new ol.interaction.Select();
    //map.addInteraction(interaction);
}

/*
function drawPoint(color,radius){
    setDefaultFeatures();
    type = "Point";
    point_color = color;
    point_radius = radius;
    runBrush();
}
*/

function drawLine(){
    setDefaultFeatures();
    type = "LineString";

    text_content = $('#line_text_content').val();//content;
    text_color = $('#line_menu > .fields').first().children(".field:nth-child(2)").children('.color_picker').val();//color;
    text_size = parseFloat($('#line_text_size').val());//size;
    text_rotation = parseInt($('#line_text_arc').text())*Math.PI/180;

    line_color = $('#line_menu > .fields:nth-child(4)').children(".field:nth-child(2)").children('.color_picker').val();
    line_width = parseInt($('#line_size').val());

    runBrush("line");
}

function drawPolygon(){
    setDefaultFeatures();
    type = "Polygon";

    text_content = $('#poly_text_content').val();//content;
    text_color = $('#poly_menu > .fields').first().children(".field:nth-child(2)").children('.color_picker').val();//color;
    text_size = parseFloat($('#poly_text_size').val());//size;
    text_rotation = parseInt($('#poly_text_arc').text())*Math.PI/180;

    line_color = $('#poly_menu > .fields:nth-child(4)').children(".field:nth-child(2)").children('.color_picker').val();
    line_width = parseInt($("#poly_border_size").val());

    if ($('#poly_menu > .fields:nth-child(4)').children(".field:nth-child(3)").children('.color_picker').val() == "") {
        plane_color = hexToRgbA("#000000");
    }else{
        plane_color = hexToRgbA($('#poly_menu > .fields:nth-child(4)').children(".field:nth-child(3)").children('.color_picker').val());
    }
    runBrush("polygon");
}

/*
function drawCircle(circle_plane_color,circle_line_color){
    setDefaultFeatures();
    type = "Circle";
    plane_color = circle_plane_color;
    line_color = circle_line_color;
    line_width = 3;
    runBrush();
}
*/

function drawIconText(/*content,color,size,rotation*/){
    setDefaultFeatures();
    type = "Point";
    text_content = $('#point_text_content').val();//content;
    text_color = $('#point_menu > .fields').first().children(".field:nth-child(2)").children('.color_picker').val();//color;
    text_size = parseFloat($('#point_text_size').val());//size;
    text_rotation = parseInt($('#point_text_arc').html())*Math.PI/180;
    var draw_type = "font";
    if ($("input[name=point_icon]:checked").val() != "none") {
        icon_url = $("input[name=point_icon]:checked").val();
        isIcon = true;
        switch(icon_url){
            case 'img/marker01.png': draw_type = "home";        break;
            case 'img/marker02.png': draw_type = "h";           break;
            case 'img/marker03.png': draw_type = "warning_sign";    break;
        }
    }
    runBrush(draw_type);
}

/*
function putIcon(url){
    setDefaultFeatures();
    type = "Point";

    console.log( icon_url);

    text_content = $('#icon_text').val();//content;
    text_color = "rgb(0,0,0)";
    text_size = 1;

    var draw_type = "";
    switch(icon_url){
        case 'img/marker01.png': draw_type = "home";        break;
        case 'img/marker02.png': draw_type = "h";           break;
        case 'img/marker03.png': draw_type = "warning sign";    break;
    }
    runBrush(draw_type);
}
*/



var $cnt = 0;
// draw the shape on the map and append it to editor to make it editable
function runBrush(draw_type) {
    draw = new ol.interaction.Draw({
        features: features,
        type: /** @type {ol.geom.GeometryType} */ (type)
    });
    map.addInteraction(draw);

    if(is_measure)  createMeasureTooltip();

    draw.on('drawstart',function(event){
        var s = new ol.style.Style({
            image: getImage(),
            stroke: new ol.style.Stroke({
                color: line_color,
                width: line_width,
            }),
            fill: new ol.style.Fill({
                color: plane_color,
            }),
            text: new ol.style.Text({
                font: "Microsoft Yahei,sans-serif",
                scale: text_size,
                fill: new ol.style.Fill({ color: text_color }),
                stroke: new ol.style.Stroke({color: '#660066', width: 0.8}),
                rotation: text_rotation,
                text: text_content,
                offsetY: -10
            })
        });
        event.feature.setStyle(s);

        // set current feature ID
        sketch = event.feature;
        sketch.setId(draw_type + " " + $cnt);
        // add to editor
        $("#editor > tbody").append(
            "<tr>" +
                "<td>" +
                    "<h2 class='ui center aligned header'>" + $cnt + "</h2>" +
                    "<div style='display: none;'>" + (draw_type + " " + $cnt) + "</div>" +
                "</td>" +
                "<td>" +
                    "<i class='" + ((draw_type=="line")? "arrow left" : (draw_type=="polygon")? "square outline" : (draw_type=="warning_sign")? "warning sign" : draw_type) + " icon'></i>" +
                    "(" + text_content + ")" +
                "</td>" +
                "<td>" +
                    "<button class='ui icon search button'><i class='search icon'></i></button>" +
                "</td>" +
                "<td>" +
                    "<button class='ui icon edit button'><i class='edit icon'></i></button>" +
                "</td>" +
                "<td>" +
                    "<button class='ui icon remove button'><i class='remove icon'></i></button>" +
                "</td>" +
            "</tr>"
        );
        $cnt++;

        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = event.coordinate;
        /*
        listener = sketch.getGeometry().on('change', function(evt) {
            var geom = evt.target;
            var output;
            if (geom instanceof ol.geom.LineString) {
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
        });
        */
    }, this);

}

// to choose if the point is a circle or a image
function getImage(){
    var image;
    if(isIcon){
        image = new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            scale: 1,
            src: icon_url,
        }));
    }
    else{
        image = new ol.style.Circle({
            radius: point_radius,
            fill: new ol.style.Fill({ color: point_color,})
        });
    }
    return image;
}

function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+', 0.5)';
    }
    throw new Error('Bad Hex');
}


/*************** measure function *************/

/**
* Format length output.
* @param {ol.geom.LineString} line The line.
* @return {string} The formatted length.
*/
var formatLength = function(line) {
    var length;
    var coordinates = line.getCoordinates();
    length = 0;
    var sourceProj = map.getView().getProjection();
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
        var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
        length += wgs84Sphere.haversineDistance(c1, c2);
    }
    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) + ' km';
    } else {
        output = (Math.round(length * 100) / 100) + ' m';
    }
    return output;
};

/**
* Format area output.
* @param {ol.geom.Polygon} polygon The polygon.
* @return {string} Formatted area.
*/
var formatArea = function(polygon) {
    var area;

    var sourceProj = map.getView().getProjection();
    var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(sourceProj, 'EPSG:4326'));
    var coordinates = geom.getLinearRing(0).getCoordinates();
    area = Math.abs(wgs84Sphere.geodesicArea(coordinates));

    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
    }else {
        output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
    }
    return output;
};


function clear_helptooltip(){
    //helpTooltipElement關閉
    if (helpTooltipElement) {
        if(helpTooltipElement.parentNode)
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
}

function addInteraction() {
    var type = (typeSelect.value == 'area' ? 'Polygon' : typeSelect.value == 'length' ? 'LineString' : 'Point');
    measure_draw = new ol.interaction.Draw({
        source: source,
        type: /** @type {ol.geom.GeometryType} */ (type),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.7)'
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                })
            })
        })
    });

    map.addInteraction(measure_draw);

    createMeasureTooltip();
    createHelpTooltip();

    var listener;
    measure_draw.on('drawstart',
        function(evt) {


            // set sketch
            sketch = evt.feature;
            /** @type {ol.Coordinate|undefined} */
            var tooltipCoord = evt.coordinate;
            var coord;

            if(type == "Point")
            {

                var normalCoord = 0;
                //得到經緯度座標
                coord = evt.feature.getGeometry().getCoordinates();
                normalCoord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326')

                //顯示取到四捨五入第四位
                var size = Math.pow(10, 4);
                normalCoord[0] = Math.round(normalCoord[0] * size) / size ;
                normalCoord[1] = Math.round(normalCoord[1] * size) / size ;

                measureTooltipElement.innerHTML = normalCoord;
                measureTooltip.setPosition(coord);

            }
            else
            {
                listener = sketch.getGeometry().on('change', function(evt) {
                    var geom = evt.target;
                    var output;
                    if (geom instanceof ol.geom.Polygon) {
                        output = formatArea(geom);
                        tooltipCoord = geom.getInteriorPoint().getCoordinates();
                    } else if (geom instanceof ol.geom.LineString) {
                        output = formatLength(geom);
                        tooltipCoord = geom.getLastCoordinate();
                    }
                    measureTooltipElement.innerHTML = output;
                    measureTooltip.setPosition(tooltipCoord);
                });
            }

        }, this);

    measure_draw.on('drawend',
        function() {
            measureTooltipElement.className = 'tooltip tooltip-me';
            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            ol.Observable.unByKey(listener);
        }, this);
}

/**
* Creates a new help tooltip
*/
function createHelpTooltip() {
    if (helpTooltipElement) {
        if(helpTooltipElement.parentNode)
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);

    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
      element: helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left'
    });
    map.addOverlay(helpTooltip);
}

/**
* Creates a new measure tooltip
*/
function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
}

// 清除measure圖層與tooltip
function measure_clean(){
    if (measure) {
        map.removeLayer(measure);
        measure.getSource().clear();
        source.clear();
        map.addLayer(measure);
        var staticTooltip = document.getElementsByClassName("tooltip-me");
        var length = staticTooltip.length;
        for(var i = 0; i < length; i++)
        {
            //staticTooltip[0].parentNode.removeChild(staticTooltip[0]);
            if (staticTooltip[0]) {
                staticTooltip[0].parentNode.removeChild(staticTooltip[0]);
            }
        }
        createMeasureTooltip();
      }
}

/*************** !measure function *************/

