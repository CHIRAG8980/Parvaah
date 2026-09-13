import 'package:flutter/material.dart';
import '../../providers/auth_provider.dart';

class EditProfileDialog extends StatefulWidget {
  final AuthProvider auth;

  const EditProfileDialog({super.key, required this.auth});

  static Future<void> show(BuildContext context, AuthProvider auth) {
    return showDialog(
      context: context,
      builder: (_) => EditProfileDialog(auth: auth),
    );
  }

  @override
  State<EditProfileDialog> createState() => _EditProfileDialogState();
}

class _EditProfileDialogState extends State<EditProfileDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.auth.user.name);
    _phoneController = TextEditingController(text: widget.auth.user.phone);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit Profile Information'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Full Name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phoneController,
            decoration: const InputDecoration(labelText: 'Phone Number'),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            await widget.auth.updateProfile(
              name: _nameController.text.trim(),
              phone: _phoneController.text.trim(),
            );
            if (context.mounted) Navigator.pop(context);
          },
          child: const Text('Save Changes'),
        ),
      ],
    );
  }
}
