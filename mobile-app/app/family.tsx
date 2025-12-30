import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';

import { getDependents, addDependent, type Dependent } from '../lib/api/dependents';
import { APIError } from '../lib/api/errors';

export default function FamilyScreen() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const loadDependents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDependents();
      setDependents(data);
    } catch (err) {
      console.error('Failed to load dependents:', err);
      const errorMessage =
        err instanceof APIError ? err.userMessage : 'Failed to load family members. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  async function handleAdd() {
    if (!name || !relation) return;

    try {
      setAdding(true);
      setAddError(null);
      await addDependent({ name, relation });
      setName('');
      setRelation('');
      await loadDependents();
    } catch (err) {
      console.error('Failed to add dependent:', err);
      const errorMessage =
        err instanceof APIError ? err.userMessage : 'Failed to add family member. Please try again.';
      setAddError(errorMessage);
    } finally {
      setAdding(false);
    }
  }

  useEffect(() => {
    loadDependents();
  }, []);

  if (loading && dependents.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error && dependents.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: '#d32f2f',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadDependents}
          style={{
            backgroundColor: '#000',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>
        Family Members
      </Text>

      {/* Add Dependent */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Add Family Member
        </Text>

        {addError && (
          <Text
            style={{
              color: '#d32f2f',
              fontSize: 14,
              marginTop: 8,
            }}
          >
            {addError}
          </Text>
        )}

        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setAddError(null);
          }}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
          }}
        />

        <TextInput
          placeholder="Relation (son, daughter, father)"
          value={relation}
          onChangeText={(text) => {
            setRelation(text);
            setAddError(null);
          }}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
          }}
        />

        <TouchableOpacity
          onPress={handleAdd}
          disabled={adding || !name || !relation}
          style={{
            marginTop: 12,
            backgroundColor: adding || !name || !relation ? '#ccc' : '#000',
            paddingVertical: 14,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            {adding ? 'Adding...' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={{ marginTop: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Your Family
        </Text>

        {loading && <Text style={{ marginTop: 10 }}>Loading...</Text>}

        {error && dependents.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: '#d32f2f', marginBottom: 8 }}>{error}</Text>
            <TouchableOpacity
              onPress={loadDependents}
              style={{
                backgroundColor: '#000',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && dependents.length === 0 && !error && (
          <Text style={{ color: '#666', marginTop: 10 }}>
            No family members added yet.
          </Text>
        )}

        {dependents.map((d) => (
          <View
            key={d.id}
            style={{
              marginTop: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              {d.name}
            </Text>
            <Text style={{ color: '#666' }}>
              {d.relation}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
