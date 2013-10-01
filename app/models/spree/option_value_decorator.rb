Spree::OptionValue.class_eval do

  has_attached_file :image,
    :styles        => ActiveSupport::JSON.decode(Spree::Config[:attachment_styles]).symbolize_keys!,
    :default_style => SpreeVariantOptions::VariantConfig[:option_value_default_style],
    :url           => SpreeVariantOptions::VariantConfig[:option_value_url],
    :path          => SpreeVariantOptions::VariantConfig[:option_value_path]

  def has_image?
    image_file_name && !image_file_name.empty?
  end
end
