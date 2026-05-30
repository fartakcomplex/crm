<?php
/**
 * Plugin Name: Smart CMS Bridge
 * Plugin URI: https://smart-cms.example.com
 * Description: A comprehensive WordPress plugin that bridges WordPress with Smart CMS. Provides custom REST API endpoints for post fetching, real-time webhook notifications, and connection management.
 * Version: 2.0.0
 * Author: Smart CMS Team
 * Author URI: https://smart-cms.example.com
 * License: GPL v2 or later
 * Text Domain: smart-cms-bridge
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 *
 * === FEATURES ===
 * - Custom REST API: /wp-json/smart-cms/v1/posts (with filters, pagination, incremental sync)
 * - Custom REST API: /wp-json/smart-cms/v1/categories
 * - Custom REST API: /wp-json/smart-cms/v1/tags
 * - Custom REST API: /wp-json/smart-cms/v1/stats
 * - Custom REST API: /wp-json/smart-cms/v1/heartbeat (connection test)
 * - Webhook notifications: post_created, post_updated, post_deleted, post_status_changed
 * - Admin settings page with connection testing
 * - Incremental sync via modified_after parameter
 * - Featured image and author information included
 * - Category and tag metadata included in post data
 */

if (!defined('ABSPATH')) {
    exit;
}

// ─── Constants ────────────────────────────────────────────────────────────────

define('SCMS_VERSION', '2.0.0');
define('SCMS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SCMS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SCMS_REST_NAMESPACE', 'smart-cms/v1');
define('SCMS_OPTION_GROUP', 'scms_bridge_options');
define('SCMS_API_KEY_OPTION', 'scms_bridge_api_key');
define('SCMS_WEBHOOK_URL_OPTION', 'scms_bridge_webhook_url');
define('SCMS_WEBHOOK_SECRET_OPTION', 'scms_bridge_webhook_secret');
define('SCMS_ENABLED_OPTION', 'scms_bridge_enabled');
define('SCMS_SYNC_POST_TYPES_OPTION', 'scms_bridge_post_types');
define('SCMS_EXCLUDE_CATEGORIES_OPTION', 'scms_bridge_exclude_categories');

// ─── Main Plugin Class ────────────────────────────────────────────────────────

class Smart_CMS_Bridge {

    /** @var string */
    private $api_key = '';

    /** @var string */
    private $webhook_url = '';

    /** @var string */
    private $webhook_secret = '';

    /** @var bool */
    private $enabled = false;

    /** @var array */
    private $post_types = ['post'];

    /** @var array */
    private $exclude_categories = [];

    // ─── Initialization ──────────────────────────────────────────────────────

    public function __construct() {
        $this->load_options();
        $this->init_hooks();
    }

    private function load_options(): void {
        $this->api_key           = get_option(SCMS_API_KEY_OPTION, '');
        $this->webhook_url       = get_option(SCMS_WEBHOOK_URL_OPTION, '');
        $this->webhook_secret    = get_option(SCMS_WEBHOOK_SECRET_OPTION, '');
        $this->enabled           = get_option(SCMS_ENABLED_OPTION, 'yes') === 'yes';
        $this->post_types        = get_option(SCMS_SYNC_POST_TYPES_OPTION, ['post']);
        $this->exclude_categories = get_option(SCMS_EXCLUDE_CATEGORIES_OPTION, []);
        
        if (!is_array($this->post_types)) {
            $this->post_types = ['post'];
        }
        if (!is_array($this->exclude_categories)) {
            $this->exclude_categories = [];
        }
    }

    private function init_hooks(): void {
        // Admin hooks
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('plugin_action_links_' . plugin_basename(__FILE__), [$this, 'add_plugin_action_links']);

        // REST API hooks
        add_action('rest_api_init', [$this, 'register_rest_routes']);

        // Webhook hooks
        if ($this->enabled && !empty($this->webhook_url)) {
            add_action('save_post', [$this, 'on_post_save'], 10, 3);
            add_action('before_delete_post', [$this, 'on_post_delete'], 10, 1);
            add_action('transition_post_status', [$this, 'on_post_status_change'], 10, 3);
            add_action('set_object_terms', [$this, 'on_post_terms_change'], 10, 4);
        }

        // Cron hook for periodic heartbeat
        add_action('scms_periodic_heartbeat', [$this, 'send_heartbeat']);
        if (!wp_next_scheduled('scms_periodic_heartbeat')) {
            wp_schedule_event(time(), 'hourly', 'scms_periodic_heartbeat');
        }

        // Activation / Deactivation
        register_activation_hook(__FILE__, [$this, 'on_activate']);
        register_deactivation_hook(__FILE__, [$this, 'on_deactivate']);
    }

    // ─── Activation / Deactivation ──────────────────────────────────────────

    public function on_activate(): void {
        // Set default options
        if (get_option(SCMS_API_KEY_OPTION) === false) {
            update_option(SCMS_API_KEY_OPTION, $this->generate_api_key());
        }
        if (get_option(SCMS_ENABLED_OPTION) === false) {
            update_option(SCMS_ENABLED_OPTION, 'yes');
        }
        if (get_option(SCMS_SYNC_POST_TYPES_OPTION) === false) {
            update_option(SCMS_SYNC_POST_TYPES_OPTION, ['post']);
        }

        // Add rewrite rules for pretty permalinks
        flush_rewrite_rules();

        // Log activation
        $this->log('Plugin activated — Smart CMS Bridge v' . SCMS_VERSION);
    }

    public function on_deactivate(): void {
        // Clear scheduled events
        wp_clear_scheduled_hook('scms_periodic_heartbeat');
        flush_rewrite_rules();

        $this->log('Plugin deactivated — Smart CMS Bridge v' . SCMS_VERSION);
    }

    // ─── Admin Menu ──────────────────────────────────────────────────────────

    public function add_admin_menu(): void {
        add_menu_page(
            __('Smart CMS Bridge', 'smart-cms-bridge'),
            __('Smart CMS', 'smart-cms-bridge'),
            'manage_options',
            'smart-cms-bridge',
            [$this, 'render_settings_page'],
            'dashicons-admin-site-alt3',
            80
        );

        add_submenu_page(
            'smart-cms-bridge',
            __('Settings', 'smart-cms-bridge'),
            __('Settings', 'smart-cms-bridge'),
            'manage_options',
            'smart-cms-bridge',
            [$this, 'render_settings_page']
        );

        add_submenu_page(
            'smart-cms-bridge',
            __('Sync History', 'smart-cms-bridge'),
            __('Sync History', 'smart-cms-bridge'),
            'manage_options',
            'smart-cms-sync-log',
            [$this, 'render_sync_log_page']
        );
    }

    public function register_settings(): void {
        register_setting(SCMS_OPTION_GROUP, SCMS_API_KEY_OPTION, [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting(SCMS_OPTION_GROUP, SCMS_WEBHOOK_URL_OPTION, [
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting(SCMS_OPTION_GROUP, SCMS_WEBHOOK_SECRET_OPTION, [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting(SCMS_OPTION_GROUP, SCMS_ENABLED_OPTION, [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting(SCMS_OPTION_GROUP, SCMS_SYNC_POST_TYPES_OPTION, [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_array'],
        ]);
        register_setting(SCMS_OPTION_GROUP, SCMS_EXCLUDE_CATEGORIES_OPTION, [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_array'],
        ]);
    }

    public function sanitize_array($input): array {
        if (!is_array($input)) {
            return [];
        }
        return array_map('sanitize_text_field', $input);
    }

    public function enqueue_admin_assets($hook): void {
        if (strpos($hook, 'smart-cms') === false) {
            return;
        }

        wp_enqueue_style(
            'scms-admin-style',
            false
        );

        wp_add_inline_style('scms-admin-style', $this->get_admin_css());
    }

    private function get_admin_css(): string {
        return '
        .scms-settings-wrap { max-width: 800px; margin: 20px auto; }
        .scms-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .scms-card h2 { margin-top: 0; padding-bottom: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 8px; }
        .scms-field { margin-bottom: 16px; }
        .scms-field label { display: block; font-weight: 600; margin-bottom: 6px; }
        .scms-field .description { color: #666; font-size: 13px; margin-top: 4px; }
        .scms-status { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .scms-status.connected { background: #d4edda; color: #155724; }
        .scms-status.disconnected { background: #f8d7da; color: #721c24; }
        .scms-badge { display: inline-block; background: #0073aa; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        .scms-log-entry { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; font-family: monospace; }
        .scms-log-entry:last-child { border-bottom: none; }
        .scms-log-time { color: #999; font-size: 11px; }
        .scms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .scms-stat { text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px; }
        .scms-stat .number { font-size: 28px; font-weight: 700; color: #0073aa; }
        .scms-stat .label { font-size: 12px; color: #666; margin-top: 4px; }
        .scms-toggle { display: flex; align-items: center; gap: 10px; }
        .scms-input { width: 100%; max-width: 500px; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; }
        .scms-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background 0.2s; }
        .scms-btn-primary { background: #0073aa; color: #fff; }
        .scms-btn-primary:hover { background: #005177; }
        .scms-btn-secondary { background: #f0f0f0; color: #333; }
        .scms-btn-secondary:hover { background: #e0e0e0; }
        .scms-btn-danger { background: #dc3545; color: #fff; }
        .scms-btn-danger:hover { background: #c82333; }
        .scms-checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; }
        .scms-checkbox-group label { display: flex; align-items: center; gap: 6px; padding: 4px 0; }
        ';
    }

    public function add_plugin_action_links($links): array {
        $settings_link = '<a href="admin.php?page=smart-cms-bridge">' . __('Settings', 'smart-cms-bridge') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    // ─── Settings Page ──────────────────────────────────────────────────────

    public function render_settings_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $this->load_options();

        // Handle regenerate API key
        if (isset($_POST['scms_regenerate_key']) && check_admin_referer('scms_regenerate_key')) {
            $new_key = $this->generate_api_key();
            update_option(SCMS_API_KEY_OPTION, $new_key);
            $this->api_key = $new_key;
            echo '<div class="notice notice-success is-dismissible"><p>' . __('API Key regenerated successfully!', 'smart-cms-bridge') . '</p></div>';
        }

        // Handle connection test
        $test_result = null;
        if (isset($_POST['scms_test_connection']) && check_admin_referer('scms_test_connection')) {
            $test_result = $this->test_connection();
        }

        // Handle manual sync
        $sync_result = null;
        if (isset($_POST['scms_manual_sync']) && check_admin_referer('scms_manual_sync')) {
            $sync_result = $this->manual_sync();
        }
        ?>
        <div class="wrap scms-settings-wrap">
            <h1 style="display:flex;align-items:center;gap:10px;">
                <span class="dashicons dashicons-admin-site-alt3" style="font-size:28px;color:#0073aa;"></span>
                Smart CMS Bridge
                <span class="scms-badge">v<?php echo esc_html(SCMS_VERSION); ?></span>
            </h1>

            <!-- Connection Status Card -->
            <div class="scms-card">
                <h2><span class="dashicons dashicons-admin-site"></span> <?php _e('Connection Status', 'smart-cms-bridge'); ?></h2>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
                    <div>
                        <?php if ($this->enabled && !empty($this->api_key)): ?>
                            <span class="scms-status connected">
                                <span class="dashicons dashicons-yes-alt"></span>
                                <?php _e('API Active', 'smart-cms-bridge'); ?>
                            </span>
                        <?php else: ?>
                            <span class="scms-status disconnected">
                                <span class="dashicons dashicons-dismiss"></span>
                                <?php _e('API Inactive', 'smart-cms-bridge'); ?>
                            </span>
                        <?php endif; ?>

                        <?php if (!empty($this->webhook_url)): ?>
                            <span class="scms-status connected" style="margin-right:8px;">
                                <span class="dashicons dashicons-yes-alt"></span>
                                <?php _e('Webhook Configured', 'smart-cms-bridge'); ?>
                            </span>
                        <?php else: ?>
                            <span class="scms-status disconnected" style="margin-right:8px;">
                                <span class="dashicons dashicons-dismiss"></span>
                                <?php _e('No Webhook', 'smart-cms-bridge'); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                    <div>
                        <?php if ($test_result !== null): ?>
                            <?php if ($test_result['success']): ?>
                                <span class="scms-status connected">
                                    <span class="dashicons dashicons-yes-alt"></span>
                                    <?php echo esc_html($test_result['message']); ?>
                                </span>
                            <?php else: ?>
                                <span class="scms-status disconnected">
                                    <span class="dashicons dashicons-dismiss"></span>
                                    <?php echo esc_html($test_result['message']); ?>
                                </span>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Stats -->
                <div class="scms-grid" style="margin-top:20px;">
                    <div class="scms-stat">
                        <div class="number"><?php echo $this->count_syncable_posts(); ?></div>
                        <div class="label"><?php _e('Syncable Posts', 'smart-cms-bridge'); ?></div>
                    </div>
                    <div class="scms-stat">
                        <div class="number"><?php echo $this->count_webhooks_sent(); ?></div>
                        <div class="label"><?php _e('Webhooks Sent', 'smart-cms-bridge'); ?></div>
                    </div>
                </div>
            </div>

            <!-- Settings Form -->
            <form method="post" action="options.php">
                <?php settings_fields(SCMS_OPTION_GROUP); ?>

                <div class="scms-card">
                    <h2><span class="dashicons dashicons-admin-generic"></span> <?php _e('General Settings', 'smart-cms-bridge'); ?></h2>

                    <div class="scms-field">
                        <label><?php _e('Enable API', 'smart-cms-bridge'); ?></label>
                        <div class="scms-toggle">
                            <select name="<?php echo esc_attr(SCMS_ENABLED_OPTION); ?>">
                                <option value="yes" <?php selected($this->enabled, true); ?>><?php _e('Yes', 'smart-cms-bridge'); ?></option>
                                <option value="no" <?php selected($this->enabled, false); ?>><?php _e('No', 'smart-cms-bridge'); ?></option>
                            </select>
                        </div>
                        <p class="description"><?php _e('Enable or disable the Smart CMS REST API endpoints.', 'smart-cms-bridge'); ?></p>
                    </div>

                    <div class="scms-field">
                        <label><?php _e('API Key', 'smart-cms-bridge'); ?></label>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <input type="text" name="<?php echo esc_attr(SCMS_API_KEY_OPTION); ?>" value="<?php echo esc_attr($this->api_key); ?>" class="scms-input" readonly style="direction:ltr;text-align:left;font-family:monospace;" />
                            <button type="button" class="scms-btn scms-btn-secondary" onclick="navigator.clipboard.writeText('<?php echo esc_js($this->api_key); ?>');this.textContent='<?php _e('Copied!', 'smart-cms-bridge'); ?>';setTimeout(()=>this.textContent='<?php _e('Copy', 'smart-cms-bridge'); ?>',2000);">
                                <?php _e('Copy', 'smart-cms-bridge'); ?>
                            </button>
                        </div>
                        <p class="description"><?php _e('Use this key in your Smart CMS to authenticate API requests.', 'smart-cms-bridge'); ?></p>
                    </div>

                    <div class="scms-field">
                        <label><?php _e('Post Types to Sync', 'smart-cms-bridge'); ?></label>
                        <div class="scms-checkbox-group">
                            <?php
                            $public_post_types = get_post_types(['public' => true], 'objects');
                            foreach ($public_post_types as $pt):
                            ?>
                                <label>
                                    <input type="checkbox" name="<?php echo esc_attr(SCMS_SYNC_POST_TYPES_OPTION); ?>[]" value="<?php echo esc_attr($pt->name); ?>" <?php checked(in_array($pt->name, $this->post_types)); ?> />
                                    <?php echo esc_html($pt->labels->name); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <div class="scms-card">
                    <h2><span class="dashicons dashicons-share-alt2"></span> <?php _e('Webhook Settings', 'smart-cms-bridge'); ?></h2>

                    <div class="scms-field">
                        <label><?php _e('Webhook URL', 'smart-cms-bridge'); ?></label>
                        <input type="url" name="<?php echo esc_attr(SCMS_WEBHOOK_URL_OPTION); ?>" value="<?php echo esc_attr($this->webhook_url); ?>" class="scms-input" placeholder="https://your-smart-cms.com/api/wordpress/webhook" dir="ltr" />
                        <p class="description"><?php _e('The URL where webhook notifications will be sent when posts are created, updated, or deleted.', 'smart-cms-bridge'); ?></p>
                    </div>

                    <div class="scms-field">
                        <label><?php _e('Webhook Secret', 'smart-cms-bridge'); ?></label>
                        <input type="text" name="<?php echo esc_attr(SCMS_WEBHOOK_SECRET_OPTION); ?>" value="<?php echo esc_attr($this->webhook_secret); ?>" class="scms-input" dir="ltr" />
                        <p class="description"><?php _e('Secret key for authenticating webhook requests. Must match the secret configured in Smart CMS.', 'smart-cms-bridge'); ?></p>
                    </div>
                </div>

                <?php submit_button(__('Save Settings', 'smart-cms-bridge'), 'scms-btn scms-btn-primary'); ?>
            </form>

            <!-- Action Buttons -->
            <div class="scms-card">
                <h2><span class="dashicons dashicons-admin-tools"></span> <?php _e('Actions', 'smart-cms-bridge'); ?></h2>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <form method="post" style="display:inline;">
                        <?php wp_nonce_field('scms_regenerate_key'); ?>
                        <button type="submit" name="scms_regenerate_key" value="1" class="scms-btn scms-btn-secondary" onclick="return confirm('<?php _e('Are you sure? This will invalidate your current API key.', 'smart-cms-bridge'); ?>');">
                            <span class="dashicons dashicons-update"></span>
                            <?php _e('Regenerate API Key', 'smart-cms-bridge'); ?>
                        </button>
                    </form>

                    <form method="post" style="display:inline;">
                        <?php wp_nonce_field('scms_test_connection'); ?>
                        <button type="submit" name="scms_test_connection" value="1" class="scms-btn scms-btn-primary">
                            <span class="dashicons dashicons-controls-play"></span>
                            <?php _e('Test API Connection', 'smart-cms-bridge'); ?>
                        </button>
                    </form>

                    <form method="post" style="display:inline;">
                        <?php wp_nonce_field('scms_manual_sync'); ?>
                        <button type="submit" name="scms_manual_sync" value="1" class="scms-btn scms-btn-primary">
                            <span class="dashicons dashicons-download"></span>
                            <?php _e('Send Manual Sync Webhook', 'smart-cms-bridge'); ?>
                        </button>
                    </form>
                </div>

                <?php if ($sync_result !== null): ?>
                    <div style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:4px;font-family:monospace;font-size:13px;">
                        <strong><?php _e('Sync Result:', 'smart-cms-bridge'); ?></strong>
                        <?php if ($sync_result['success']): ?>
                            <span style="color:green;"> <?php echo esc_html($sync_result['message']); ?></span>
                        <?php else: ?>
                            <span style="color:red;"> <?php echo esc_html($sync_result['message']); ?></span>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- API Documentation -->
            <div class="scms-card">
                <h2><span class="dashicons dashicons-code-standards"></span> <?php _e('API Endpoints', 'smart-cms-bridge'); ?></h2>
                <p><?php _e('The following REST API endpoints are available when the API is enabled:', 'smart-cms-bridge'); ?></p>
                <table class="widefat striped" style="margin-top:12px;">
                    <thead>
                        <tr>
                            <th><?php _e('Endpoint', 'smart-cms-bridge'); ?></th>
                            <th><?php _e('Method', 'smart-cms-bridge'); ?></th>
                            <th><?php _e('Description', 'smart-cms-bridge'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>/wp-json/smart-cms/v1/posts</code></td>
                            <td>GET</td>
                            <td><?php _e('List posts with filters and pagination', 'smart-cms-bridge'); ?></td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/smart-cms/v1/posts/{id}</code></td>
                            <td>GET</td>
                            <td><?php _e('Get single post details', 'smart-cms-bridge'); ?></td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/smart-cms/v1/categories</code></td>
                            <td>GET</td>
                            <td><?php _e('List all categories', 'smart-cms-bridge'); ?></td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/smart-cms/v1/tags</code></td>
                            <td>GET</td>
                            <td><?php _e('List all tags', 'smart-cms-bridge'); ?></td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/smart-cms/v1/stats</code></td>
                            <td>GET</td>
                            <td><?php _e('Get site statistics', 'smart-cms-bridge'); ?></td>
                        </tr>
                        <tr>
                            <td><code>/wp-json/smart-cms/v1/heartbeat</code></td>
                            <td>GET</td>
                            <td><?php _e('Test connection (heartbeat)', 'smart-cms-bridge'); ?></td>
                        </tr>
                    </tbody>
                </table>

                <h3 style="margin-top:20px;"><?php _e('Query Parameters for /posts', 'smart-cms-bridge'); ?></h3>
                <table class="widefat striped" style="margin-top:8px;">
                    <thead>
                        <tr>
                            <th><?php _e('Parameter', 'smart-cms-bridge'); ?></th>
                            <th><?php _e('Type', 'smart-cms-bridge'); ?></th>
                            <th><?php _e('Description', 'smart-cms-bridge'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><code>api_key</code></td><td>string</td><td><?php _e('Your API key (required)', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>page</code></td><td>integer</td><td><?php _e('Page number (default: 1)', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>per_page</code></td><td>integer</td><td><?php _e('Posts per page (default: 10, max: 100)', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>status</code></td><td>string</td><td><?php _e('Filter by status: publish, draft, pending, any (default: publish)', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>search</code></td><td>string</td><td><?php _e('Search in title and content', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>category</code></td><td>integer</td><td><?php _e('Filter by category ID', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>tag</code></td><td>integer</td><td><?php _e('Filter by tag ID', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>author</code></td><td>integer</td><td><?php _e('Filter by author ID', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>after</code></td><td>string</td><td><?php _e('Posts published after (ISO 8601 date)', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>modified_after</code></td><td>string</td><td><?php _e('Posts modified after (ISO 8601 date) — for incremental sync', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>orderby</code></td><td>string</td><td><?php _e('Order by: date, modified, title, relevance (default: date)', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>order</code></td><td>string</td><td><?php _e('Order direction: asc, desc (default: desc)', 'smart-cms-bridge'); ?></td></tr>
                        <tr><td><code>include_featured_image</code></td><td>boolean</td><td><?php _e('Include featured image URL (default: true)', 'smart-cms-bridge'); ?></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }

    // ─── Sync Log Page ──────────────────────────────────────────────────────

    public function render_sync_log_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $logs = get_option('scms_bridge_sync_log', []);
        if (!is_array($logs)) {
            $logs = [];
        }
        ?>
        <div class="wrap scms-settings-wrap">
            <h1 style="display:flex;align-items:center;gap:10px;">
                <span class="dashicons dashicons-list-view"></span>
                <?php _e('Sync Log', 'smart-cms-bridge'); ?>
            </h1>

            <div class="scms-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h2 style="margin:0;border:none;padding:0;"><?php _e('Recent Activity', 'smart-cms-bridge'); ?></h2>
                    <form method="post">
                        <?php wp_nonce_field('scms_clear_log'); ?>
                        <button type="submit" name="scms_clear_log" value="1" class="scms-btn scms-btn-danger" onclick="return confirm('<?php _e('Clear all sync logs?', 'smart-cms-bridge'); ?>');">
                            <?php _e('Clear Log', 'smart-cms-bridge'); ?>
                        </button>
                    </form>
                </div>

                <?php if (empty($logs)): ?>
                    <p style="text-align:center;color:#999;padding:40px 0;"><?php _e('No sync activity recorded yet.', 'smart-cms-bridge'); ?></p>
                <?php else: ?>
                    <?php foreach (array_reverse($logs) as $entry): ?>
                        <div class="scms-log-entry">
                            <span class="scms-log-time"><?php echo esc_html($entry['time']); ?></span>
                            <span><?php echo esc_html($entry['message']); ?></span>
                            <?php if (!empty($entry['details'])): ?>
                                <br/><small style="color:#888;"><?php echo esc_html($entry['details']); ?></small>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
        <?php

        // Handle clear log
        if (isset($_POST['scms_clear_log']) && check_admin_referer('scms_clear_log')) {
            update_option('scms_bridge_sync_log', []);
            wp_redirect(admin_url('admin.php?page=smart-cms-sync-log'));
            exit;
        }
    }

    // ─── REST API Routes ────────────────────────────────────────────────────

    public function register_rest_routes(): void {
        // Posts endpoint
        register_rest_route(SCMS_REST_NAMESPACE, '/posts', [
            'methods'             => 'GET',
            'callback'            => [$this, 'rest_get_posts'],
            'permission_callback' => [$this, 'rest_authenticate'],
            'args'                => $this->get_posts_args(),
        ]);

        // Single post endpoint
        register_rest_route(SCMS_REST_NAMESPACE, '/posts/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'rest_get_single_post'],
            'permission_callback' => [$this, 'rest_authenticate'],
            'args'                => [
                'id' => [
                    'validate_callback' => function($param) { return is_numeric($param) && $param > 0; },
                ],
            ],
        ]);

        // Categories endpoint
        register_rest_route(SCMS_REST_NAMESPACE, '/categories', [
            'methods'             => 'GET',
            'callback'            => [$this, 'rest_get_categories'],
            'permission_callback' => [$this, 'rest_authenticate'],
        ]);

        // Tags endpoint
        register_rest_route(SCMS_REST_NAMESPACE, '/tags', [
            'methods'             => 'GET',
            'callback'            => [$this, 'rest_get_tags'],
            'permission_callback' => [$this, 'rest_authenticate'],
        ]);

        // Stats endpoint
        register_rest_route(SCMS_REST_NAMESPACE, '/stats', [
            'methods'             => 'GET',
            'callback'            => [$this, 'rest_get_stats'],
            'permission_callback' => [$this, 'rest_authenticate'],
        ]);

        // Heartbeat endpoint
        register_rest_route(SCMS_REST_NAMESPACE, '/heartbeat', [
            'methods'             => 'GET',
            'callback'            => [$this, 'rest_heartbeat'],
            'permission_callback' => [$this, 'rest_authenticate'],
        ]);
    }

    private function get_posts_args(): array {
        return [
            'page'                  => ['default' => 1, 'sanitize_callback' => 'absint'],
            'per_page'              => ['default' => 10, 'sanitize_callback' => 'absint'],
            'status'                => ['default' => 'publish', 'sanitize_callback' => 'sanitize_key'],
            'search'                => ['default' => '', 'sanitize_callback' => 'sanitize_text_field'],
            'category'              => ['default' => 0, 'sanitize_callback' => 'absint'],
            'tag'                   => ['default' => 0, 'sanitize_callback' => 'absint'],
            'author'                => ['default' => 0, 'sanitize_callback' => 'absint'],
            'after'                 => ['default' => '', 'sanitize_callback' => 'sanitize_text_field'],
            'modified_after'        => ['default' => '', 'sanitize_callback' => 'sanitize_text_field'],
            'orderby'               => ['default' => 'date', 'sanitize_callback' => 'sanitize_key'],
            'order'                 => ['default' => 'desc', 'sanitize_callback' => 'sanitize_key'],
            'include_featured_image'=> ['default' => 'true', 'sanitize_callback' => 'sanitize_key'],
        ];
    }

    // ─── REST API Authentication ────────────────────────────────────────────

    public function rest_authenticate($request): bool {
        // Check if API is enabled
        if (!$this->enabled) {
            return false;
        }

        // Check API key from query param or header
        $api_key = $request->get_param('api_key');
        if (empty($api_key)) {
            $api_key = $request->get_header('x-scms-api-key');
        }
        if (empty($api_key)) {
            $auth_header = $request->get_header('authorization');
            if (!empty($auth_header) && preg_match('/Bearer\s+(.+)/i', $auth_header, $matches)) {
                $api_key = $matches[1];
            }
        }

        return !empty($api_key) && $api_key === $this->api_key;
    }

    // ─── REST API Callbacks ─────────────────────────────────────────────────

    public function rest_get_posts($request): WP_REST_Response|WP_Error {
        $params = $request->get_params();
        $this->load_options();

        $args = [
            'post_type'      => $this->post_types,
            'posts_per_page' => min(max(intval($params['per_page']), 1), 100),
            'paged'          => max(intval($params['page']), 1),
            'orderby'        => in_array($params['orderby'], ['date', 'modified', 'title', 'relevance']) ? $params['orderby'] : 'date',
            'order'          => strtolower($params['order']) === 'asc' ? 'ASC' : 'DESC',
        ];

        // Status filter
        if ($params['status'] === 'any') {
            $args['post_status'] = 'any';
        } elseif (!empty($params['status'])) {
            $args['post_status'] = $params['status'];
        }

        // Search
        if (!empty($params['search'])) {
            $args['s'] = $params['search'];
        }

        // Category filter
        if (!empty($params['category'])) {
            $args['cat'] = intval($params['category']);
        }

        // Tag filter
        if (!empty($params['tag'])) {
            $args['tag_id'] = intval($params['tag']);
        }

        // Author filter
        if (!empty($params['author'])) {
            $args['author'] = intval($params['author']);
        }

        // Date filters
        if (!empty($params['after'])) {
            $args['date_query'][] = [
                'column' => 'post_date',
                'after'  => $params['after'],
            ];
        }

        // Modified after (incremental sync)
        if (!empty($params['modified_after'])) {
            $args['date_query'][] = [
                'column' => 'post_modified',
                'after'  => $params['modified_after'],
            ];
        }

        // Exclude categories
        if (!empty($this->exclude_categories)) {
            $args['category__not_in'] = array_map('intval', $this->exclude_categories);
        }

        $query = new WP_Query($args);
        $include_featured = $params['include_featured_image'] !== 'false';

        $posts = array_map(function($post) use ($include_featured) {
            return $this->format_post($post, $include_featured);
        }, $query->posts);

        $response_data = [
            'posts'       => $posts,
            'total'       => (int) $query->found_posts,
            'pages'       => (int) $query->max_num_pages,
            'page'        => (int) $params['page'],
            'per_page'    => (int) $args['posts_per_page'],
            'site_info'   => [
                'name'        => get_bloginfo('name'),
                'description' => get_bloginfo('description'),
                'url'         => home_url(),
                'language'    => get_bloginfo('language'),
                'version'     => SCMS_VERSION,
            ],
        ];

        $this->log('API: Fetched ' . count($posts) . ' posts (page ' . $params['page'] . ')', 'total: ' . $query->found_posts);

        return new WP_REST_Response($response_data, 200);
    }

    public function rest_get_single_post($request): WP_REST_Response|WP_Error {
        $post_id = intval($request['id']);
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('not_found', 'Post not found', ['status' => 404]);
        }

        if (!in_array($post->post_type, $this->post_types)) {
            return new WP_Error('invalid_type', 'Post type not available for sync', ['status' => 403]);
        }

        return new WP_REST_Response([
            'post' => $this->format_post($post, true),
        ], 200);
    }

    public function rest_get_categories(): WP_REST_Response {
        $categories = get_categories([
            'hide_empty' => false,
            'taxonomy'   => 'category',
        ]);

        $data = array_map(function($cat) {
            return [
                'id'          => (int) $cat->term_id,
                'name'        => $cat->name,
                'slug'        => $cat->slug,
                'description' => $cat->description,
                'count'       => (int) $cat->count,
                'parent'      => (int) $cat->parent,
            ];
        }, $categories);

        return new WP_REST_Response(['categories' => $data], 200);
    }

    public function rest_get_tags(): WP_REST_Response {
        $tags = get_tags(['hide_empty' => false]);

        $data = array_map(function($tag) {
            return [
                'id'    => (int) $tag->term_id,
                'name'  => $tag->name,
                'slug'  => $tag->slug,
                'count' => (int) $tag->count,
            ];
        }, $tags);

        return new WP_REST_Response(['tags' => $data], 200);
    }

    public function rest_get_stats(): WP_REST_Response {
        $post_counts = wp_count_posts('post');

        return new WP_REST_Response([
            'stats' => [
                'total_posts'    => (int) ($post_counts->publish + $post_counts->draft + $post_counts->pending + $post_counts->future + $post_counts->private),
                'published'      => (int) $post_counts->publish,
                'drafts'         => (int) $post_counts->draft,
                'pending'        => (int) $post_counts->pending,
                'total_categories' => (int) wp_count_terms('category'),
                'total_tags'     => (int) wp_count_terms('post_tag'),
                'total_authors'  => (int) count(get_users(['role__in' => ['administrator', 'editor', 'author']])),
                'total_media'    => (int) wp_count_posts('attachment')->inherit,
                'site_name'      => get_bloginfo('name'),
                'site_url'       => home_url(),
                'wp_version'     => get_bloginfo('version'),
                'plugin_version' => SCMS_VERSION,
                'php_version'    => PHP_VERSION,
                'last_modified'  => get_posts([
                    'post_type'      => 'post',
                    'posts_per_page' => 1,
                    'orderby'        => 'modified',
                    'order'          => 'DESC',
                    'fields'         => 'ids',
                ]) ? get_the_modified_date('c', reset(get_posts([
                    'post_type'      => 'post',
                    'posts_per_page' => 1,
                    'orderby'        => 'modified',
                    'order'          => 'DESC',
                    'fields'         => 'ids',
                ]))) : null,
            ],
        ], 200);
    }

    public function rest_heartbeat(): WP_REST_Response {
        return new WP_REST_Response([
            'status'      => 'ok',
            'timestamp'   => current_time('mysql'),
            'version'     => SCMS_VERSION,
            'wp_version'  => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'site_url'    => home_url(),
            'site_name'   => get_bloginfo('name'),
        ], 200);
    }

    // ─── Post Formatting ────────────────────────────────────────────────────

    private function format_post(WP_Post $post, bool $include_featured): array {
        $author = get_the_author_meta('login', $post->post_author);
        $author_name = get_the_author_meta('display_name', $post->post_author);
        $author_email = get_the_author_meta('email', $post->post_author);

        $data = [
            'id'                => (int) $post->ID,
            'title'             => [
                'rendered' => get_the_title($post->ID),
                'raw'      => $post->post_title,
            ],
            'content'           => [
                'rendered' => apply_filters('the_content', $post->post_content),
                'raw'      => $post->post_content,
            ],
            'excerpt'           => [
                'rendered' => apply_filters('the_excerpt', $post->post_excerpt),
                'raw'      => $post->post_excerpt,
            ],
            'slug'              => $post->post_name,
            'status'            => $post->post_status,
            'date'              => $post->post_date,
            'date_gmt'          => $post->post_date_gmt,
            'modified'          => $post->post_modified,
            'modified_gmt'      => $post->post_modified_gmt,
            'type'              => $post->post_type,
            'author'            => [
                'id'     => (int) $post->post_author,
                'login'  => $author,
                'name'   => $author_name,
                'email'  => $author_email,
                'url'    => get_author_posts_url($post->post_author),
            ],
            'categories'        => $this->get_post_categories($post->ID),
            'tags'              => $this->get_post_tags($post->ID),
            'comment_count'     => (int) $post->comment_count,
            'link'              => get_permalink($post->ID),
            'guid'              => $post->guid,
        ];

        if ($include_featured) {
            $data['featured_media'] = $this->get_featured_image($post->ID);
        }

        return $data;
    }

    private function get_post_categories(int $post_id): array {
        $categories = get_the_category($post_id);
        if (!$categories || is_wp_error($categories)) {
            return [];
        }

        return array_map(function($cat) {
            return [
                'id'    => (int) $cat->term_id,
                'name'  => $cat->name,
                'slug'  => $cat->slug,
                'count' => (int) $cat->count,
            ];
        }, $categories);
    }

    private function get_post_tags(int $post_id): array {
        $tags = get_the_tags($post_id);
        if (!$tags || is_wp_error($tags)) {
            return [];
        }

        return array_map(function($tag) {
            return [
                'id'    => (int) $tag->term_id,
                'name'  => $tag->name,
                'slug'  => $tag->slug,
                'count' => (int) $tag->count,
            ];
        }, $tags);
    }

    private function get_featured_image(int $post_id): array|null {
        $thumb_id = get_post_thumbnail_id($post_id);
        if (!$thumb_id) {
            return null;
        }

        $image = wp_get_attachment_image_src($thumb_id, 'full');
        $image_medium = wp_get_attachment_image_src($thumb_id, 'medium');
        $image_thumbnail = wp_get_attachment_image_src($thumb_id, 'thumbnail');

        if (!$image) {
            return null;
        }

        return [
            'id'         => (int) $thumb_id,
            'url'        => $image[0],
            'width'      => (int) $image[1],
            'height'     => (int) $image[2],
            'medium_url' => $image_medium ? $image_medium[0] : null,
            'thumbnail_url' => $image_thumbnail ? $image_thumbnail[0] : null,
            'alt'        => get_post_meta($thumb_id, '_wp_attachment_image_alt', true),
            'title'      => get_the_title($thumb_id),
        ];
    }

    // ─── Webhook System ─────────────────────────────────────────────────────

    public function on_post_save(int $post_id, WP_Post $post, bool $update): void {
        if (wp_is_post_revision($post_id)) return;
        if (wp_is_post_autosave($post_id)) return;
        if ($post->post_status === 'auto-draft') return;
        if (!in_array($post->post_type, $this->post_types)) return;

        $event = $update ? 'post_updated' : 'post_created';

        $this->send_webhook($event, [
            'post_id'    => $post->ID,
            'title'      => $post->post_title,
            'content'    => $post->post_content,
            'excerpt'    => $post->post_excerpt,
            'status'     => $post->post_status,
            'slug'       => $post->post_name,
            'author'     => get_the_author_meta('login', $post->post_author),
            'type'       => $post->post_type,
            'date'       => $post->post_date,
            'modified'   => $post->post_modified,
            'permalink'  => get_permalink($post->ID),
            'categories' => $this->get_post_categories($post->ID),
            'tags'       => $this->get_post_tags($post->ID),
            'featured_media' => $this->get_featured_image($post->ID),
        ]);
    }

    public function on_post_status_change(string $new_status, string $old_status, WP_Post $post): void {
        if ($new_status === $old_status) return;
        if (wp_is_post_revision($post->ID)) return;
        if (!in_array($post->post_type, $this->post_types)) return;

        $this->send_webhook('post_status_changed', [
            'post_id'    => $post->ID,
            'title'      => $post->post_title,
            'old_status' => $old_status,
            'new_status' => $new_status,
            'slug'       => $post->post_name,
            'permalink'  => get_permalink($post->ID),
        ]);
    }

    public function on_post_delete(int $post_id): void {
        $post = get_post($post_id);
        if (!$post) return;
        if (wp_is_post_revision($post_id)) return;
        if (!in_array($post->post_type, $this->post_types)) return;

        $this->send_webhook('post_deleted', [
            'post_id' => $post_id,
            'title'   => $post->post_title,
            'slug'    => $post->post_name,
            'type'    => $post->post_type,
        ]);
    }

    public function on_post_terms_change(int $post_id, array $terms, string $taxonomy, bool $append): void {
        if (!in_array($taxonomy, ['category', 'post_tag'])) return;
        $post = get_post($post_id);
        if (!$post || !in_array($post->post_type, $this->post_types)) return;

        $this->send_webhook('post_terms_updated', [
            'post_id'    => $post_id,
            'title'      => $post->post_title,
            'taxonomy'   => $taxonomy,
            'categories' => $this->get_post_categories($post_id),
            'tags'       => $this->get_post_tags($post_id),
        ]);
    }

    private function send_webhook(string $event, array $post_data): void {
        if (empty($this->webhook_url)) return;

        $payload = wp_json_encode([
            'event'     => $event,
            'timestamp' => current_time('mysql'),
            'site_url'  => home_url(),
            'data'      => $post_data,
            'secret'    => $this->webhook_secret,
        ]);

        if ($payload === false) {
            $this->log('Webhook error: Failed to encode payload for ' . $event, '');
            return;
        }

        $response = wp_remote_post($this->webhook_url, [
            'headers' => [
                'Content-Type'  => 'application/json',
                'X-Smart-CMS'   => 'webhook',
                'X-Event-Type'  => $event,
            ],
            'body'    => $payload,
            'timeout' => 10,
        ]);

        if (is_wp_error($response)) {
            $this->log('Webhook FAILED: ' . $response->get_error_message(), 'event: ' . $event);
        } else {
            $code = wp_remote_retrieve_response_code($response);
            $body = wp_remote_retrieve_body($response);
            $this->log('Webhook sent: ' . $event . ' (HTTP ' . $code . ')', 'post_id: ' . ($post_data['post_id'] ?? 'unknown'));
        }
    }

    public function send_heartbeat(): void {
        if (empty($this->webhook_url)) return;

        $stats = $this->get_sync_stats();

        $this->send_webhook('heartbeat', $stats);
    }

    // ─── Utility Methods ────────────────────────────────────────────────────

    private function generate_api_key(): string {
        return 'scms_' . bin2hex(random_bytes(24));
    }

    private function test_connection(): array {
        $site_url = home_url();
        $endpoint = trailingslashit($site_url) . 'wp-json/' . SCMS_REST_NAMESPACE . '/heartbeat?api_key=' . urlencode($this->api_key);

        $response = wp_remote_get($endpoint, ['timeout' => 10]);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => __('Connection failed: ', 'smart-cms-bridge') . $response->get_error_message(),
            ];
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code === 200 && isset($body['status']) && $body['status'] === 'ok') {
            return [
                'success' => true,
                'message' => sprintf(
                    __('Connected! Plugin v%s, WordPress v%s', 'smart-cms-bridge'),
                    $body['version'] ?? SCMS_VERSION,
                    $body['wp_version'] ?? 'unknown'
                ),
            ];
        }

        return [
            'success' => false,
            'message' => sprintf(__('Unexpected response (HTTP %d). Check your API key.', 'smart-cms-bridge'), $code),
        ];
    }

    private function manual_sync(): array {
        if (empty($this->webhook_url)) {
            return [
                'success' => false,
                'message' => __('Webhook URL is not configured. Please set it in Webhook Settings.', 'smart-cms-bridge'),
            ];
        }

        $stats = $this->get_sync_stats();

        $response = wp_remote_post($this->webhook_url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Smart-CMS'  => 'manual-sync',
            ],
            'body'    => wp_json_encode([
                'event'     => 'manual_sync_request',
                'timestamp' => current_time('mysql'),
                'site_url'  => home_url(),
                'data'      => $stats,
                'secret'    => $this->webhook_secret,
            ]),
            'timeout' => 10,
        ]);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => __('Webhook failed: ', 'smart-cms-bridge') . $response->get_error_message(),
            ];
        }

        return [
            'success' => true,
            'message' => sprintf(__('Manual sync webhook sent. (%d total posts available)', 'smart-cms-bridge'), $stats['total_posts']),
        ];
    }

    private function get_sync_stats(): array {
        $counts = wp_count_posts('post');

        return [
            'total_posts'     => (int) ($counts->publish + $counts->draft + $counts->pending),
            'published'       => (int) $counts->publish,
            'drafts'          => (int) $counts->draft,
            'total_categories'=> (int) wp_count_terms('category'),
            'total_tags'      => (int) wp_count_terms('post_tag'),
            'site_name'       => get_bloginfo('name'),
            'site_url'        => home_url(),
        ];
    }

    private function count_syncable_posts(): int {
        $counts = wp_count_posts('post');
        return (int) ($counts->publish + $counts->draft + $counts->pending + $counts->future + $counts->private);
    }

    private function count_webhooks_sent(): int {
        $logs = get_option('scms_bridge_sync_log', []);
        return is_array($logs) ? count(array_filter($logs, function($l) {
            return strpos($l['message'] ?? '', 'Webhook sent') !== false;
        })) : 0;
    }

    private function log(string $message, string $details = ''): void {
        $logs = get_option('scms_bridge_sync_log', []);
        if (!is_array($logs)) {
            $logs = [];
        }

        // Keep only last 500 entries
        array_push($logs, [
            'time'    => current_time('mysql'),
            'message' => $message,
            'details' => $details,
        ]);

        if (count($logs) > 500) {
            $logs = array_slice($logs, -500);
        }

        update_option('scms_bridge_sync_log', $logs);

        // Also log to PHP error log
        error_log('[Smart CMS Bridge] ' . $message . ($details ? ' — ' . $details : ''));
    }
}

// ─── Initialize Plugin ─────────────────────────────────────────────────────────

new Smart_CMS_Bridge();
