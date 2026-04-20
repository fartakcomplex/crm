import { NextResponse } from 'next/server'

// GET plugin installation instructions and code
export async function GET() {
  try {
    const pluginCode = `<?php
/**
 * Plugin Name: Smart CMS Webhook Bridge
 * Plugin URI: https://smart-cms.example.com
 * Description: Sends webhook notifications to Smart CMS when posts are created, updated, or deleted.
 * Version: 1.0.0
 * Author: Smart CMS
 * Text Domain: smart-cms-webhook
 */

if (!defined('ABSPATH')) {
    exit;
}

class Smart_CMS_Webhook_Bridge {

    private $webhook_url = '';
    private $webhook_secret = '';

    public function __construct() {
        $this->webhook_url   = get_option('scms_webhook_url', '');
        $this->webhook_secret = get_option('scms_webhook_secret', '');

        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('save_post', [$this, 'on_post_save'], 10, 3);
        add_action('before_delete_post', [$this, 'on_post_delete'], 10, 1);
        add_action('transition_post_status', [$this, 'on_post_status_change'], 10, 3);
    }

    public function add_settings_page() {
        add_options_page(
            'Smart CMS Webhook',
            'Smart CMS Webhook',
            'manage_options',
            'smart-cms-webhook',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('scms_webhook_group', 'scms_webhook_url');
        register_setting('scms_webhook_group', 'scms_webhook_secret');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Smart CMS Webhook Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('scms_webhook_group'); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="scms_webhook_url">Webhook URL</label></th>
                        <td>
                            <input type="url" name="scms_webhook_url"
                                   id="scms_webhook_url"
                                   value="<?php echo esc_attr($this->webhook_url); ?>"
                                   class="regular-text" />
                            <p class="description">The Smart CMS webhook endpoint URL.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="scms_webhook_secret">Webhook Secret</label></th>
                        <td>
                            <input type="text" name="scms_webhook_secret"
                                   id="scms_webhook_secret"
                                   value="<?php echo esc_attr($this->webhook_secret); ?>"
                                   class="regular-text" />
                            <p class="description">Secret key for webhook authentication.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    private function send_webhook($event, $post_data) {
        if (empty($this->webhook_url)) return;

        $payload = json_encode([
            'event'     => $event,
            'timestamp' => current_time('mysql'),
            'data'      => $post_data,
            'secret'    => $this->webhook_secret,
        ]);

        $response = wp_remote_post($this->webhook_url, [
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => $payload,
            'timeout' => 10,
        ]);

        if (is_wp_error($response)) {
            error_log('Smart CMS Webhook Error: ' . $response->get_error_message());
        }
    }

    public function on_post_save($post_id, $post, $update) {
        if (wp_is_post_revision($post_id) || $post->post_status === 'auto-draft') return;

        $event = $update ? 'post_updated' : 'post_created';

        $this->send_webhook($event, [
            'post_id'    => $post_id,
            'title'      => $post->post_title,
            'content'    => $post->post_content,
            'excerpt'    => $post->post_excerpt,
            'status'     => $post->post_status,
            'slug'       => $post->post_name,
            'author'     => get_the_author_meta('login', $post->post_author),
            'type'       => $post->post_type,
            'date'       => $post->post_date,
            'modified'   => $post->post_modified,
        ]);
    }

    public function on_post_status_change($new_status, $old_status, $post) {
        if ($new_status === $old_status) return;
        if (wp_is_post_revision($post->ID)) return;

        $this->send_webhook('post_status_changed', [
            'post_id'     => $post->ID,
            'title'       => $post->post_title,
            'old_status'  => $old_status,
            'new_status'  => $new_status,
            'slug'        => $post->post_name,
        ]);
    }

    public function on_post_delete($post_id) {
        $post = get_post($post_id);
        if (!$post || wp_is_post_revision($post_id)) return;

        $this->send_webhook('post_deleted', [
            'post_id' => $post_id,
            'title'   => $post->post_title,
            'slug'    => $post->post_name,
            'type'    => $post->post_type,
        ]);
    }
}

new Smart_CMS_Webhook_Bridge();
`;

    return NextResponse.json({
      success: true,
      data: {
        pluginName: 'Smart CMS Webhook Bridge',
        version: '1.0.0',
        description: 'Sends webhook notifications to Smart CMS when posts are created, updated, or deleted.',
        supportedEvents: [
          'post_created',
          'post_updated',
          'post_deleted',
          'post_status_changed',
        ],
        installationSteps: [
          '1. Save the plugin code to a file named `smart-cms-webhook.php`',
          '2. Zip the file into `smart-cms-webhook.zip`',
          '3. In WordPress admin, go to Plugins → Add New → Upload Plugin',
          '4. Upload the zip file and click "Install Now"',
          '5. Activate the plugin',
          '6. Go to Settings → Smart CMS Webhook',
          '7. Enter your Smart CMS webhook URL (e.g., /api/wordpress/webhook)',
          '8. Enter a webhook secret for authentication',
          '9. Click "Save Changes"',
        ],
        webhookPayloadFormat: {
          event: 'post_created | post_updated | post_deleted | post_status_changed',
          timestamp: '2025-01-15 10:30:00',
          data: {
            post_id: 123,
            title: 'Post Title',
            content: 'Post content...',
            excerpt: 'Post excerpt...',
            status: 'publish | draft | pending',
            slug: 'post-slug',
            author: 'admin',
            type: 'post | page',
            date: '2025-01-15 10:00:00',
            modified: '2025-01-15 10:30:00',
          },
          secret: 'your-webhook-secret',
        },
        pluginCode,
      },
    })
  } catch (error) {
    console.error('GET /api/wordpress/plugin error:', error)
    return NextResponse.json({ error: 'Failed to fetch plugin instructions' }, { status: 500 })
  }
}
