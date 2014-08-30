require 'slim'
Slim::Engine.set_default_options :pretty => true, :disable_escape => true, :format => :html5
# Slim::Engine.set_default_options :shortcut => {'&' => {:tag => 'input', :attr => 'type'}, '#' => {:attr => 'id'}, '.' => {:attr => 'class'}}


http_path = "/"
css_dir = "inject/css"
sass_dir = "sass"
images_dir = "images"
javascripts_dir = "inject/js"

output_style = :expanded

# To enable relative paths to assets via compass helper functions. Uncomment:
# relative_assets = true

line_comments = false

preferred_syntax = :sass
fireapp_build_path = "kp"
