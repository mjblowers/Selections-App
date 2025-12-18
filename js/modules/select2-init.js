/**
 * Select2 Initialization (after jQuery loads)
 */

function initializeSelect2() {
    try {
        if (window.jQuery && jQuery.fn && jQuery.fn.select2) {
            jQuery('#rowSelect').select2({
                placeholder: 'Search for a row...',
                allowClear: true,
                width: '100%'
            });

            jQuery('#roomSelect').select2({
                placeholder: 'Search for a room...',
                allowClear: true,
                width: '100%'
            });
        }
    } catch (err) {
        console.warn('Select2 initialization skipped:', err);
    }
}

function updateSelect2(selector) {
    try {
        if (window.jQuery && jQuery.fn && jQuery.fn.select2) {
            const $el = jQuery(selector);
            if ($el.data('select2')) {
                $el.select2('destroy');
            }
            $el.select2({
                placeholder: selector === '#rowSelect' ? 'Search for a row...' : 'Search for a room...',
                allowClear: true,
                width: '100%'
            });
        }
    } catch (err) {
        console.warn('Select2 update failed:', err);
    }
}

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSelect2);
} else {
    initializeSelect2();
}

export { initializeSelect2, updateSelect2 };
