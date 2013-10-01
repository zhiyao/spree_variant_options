Spree::OptionValue.class_eval do

  attr_accessible :image

  has_attached_file :image,
    :styles        => ActiveSupport::JSON.decode(Spree::Config[:attachment_styles]).symbolize_keys!,
    :default_style => SpreeVariantOptions::VariantConfig[:option_value_default_style],
    :url           => SpreeVariantOptions::VariantConfig[:option_value_url],
    :path          => SpreeVariantOptions::VariantConfig[:option_value_path]

  def has_image?
    image_file_name && !image_file_name.empty?
  end

  scope :for_product, lambda { |product|
    uniq.where("spree_option_values_variants.variant_id IN (?)", product.variant_ids)
    .joins(:variants).order_by_positions
  }

  scope :order_by_positions, joins(:option_type).order("#{Spree::OptionType.quoted_table_name}.position asc, #{quoted_table_name}.position asc")
end
