import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const index = () => {

  interface ibadah {
    id: string;
    ibadah: string;
    waktu: string;
    isCompleted: boolean;
    category: string;
  }

  const [showForm, setShowForm] = useState(false);
  const [ibadah, setibadah] = useState('');
  const [waktu, setwaktu] = useState('');
  const [category, setCategory] = useState('');
  const [list, setList] = useState<ibadah[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const ibadahRef = useRef<TextInput>(null);
  const waktuRef = useRef<TextInput>(null);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const [filterCategory, setFilterCategory] = useState('All');
  const filteredList = filterCategory === 'All'
    ? list
    : list.filter(item => item.category === filterCategory);


  const formatDateInput = (text: string) => {
    // Hanya ambil angka
    const cleaned = text.replace(/\D+/g, '');

    // Format angka jadi dd/mm/yy
    const day = cleaned.slice(0, 2);
    const month = cleaned.slice(2, 4);
    const year = cleaned.slice(4, 6);

    let formatted = day;
    if (month) formatted += '/' + month;
    if (year) formatted += '/' + year;

    return formatted;
  };


  const saveibadahs = async () => {
    try {
      await AsyncStorage.setItem('ibadahs', JSON.stringify(list));
      console.log('Berhasil Simpan Data');
    } catch (error) {
      console.log('Gagal simpan :', error);
    }
  };

  const addibadah = () => {
  if (!ibadah.trim() || !waktu.trim() || !category.trim()) {
    Alert.alert('Data Input Gagal', 'Belum Kamu Isi Datanya');
    return;
  }

  if (waktu.length !== 8) {
    Alert.alert('Gagal Input', 'Format tanggal harus dd/mm/yy, contoh 15/04/25');
    return;
  }

  const [hariStr, bulanStr, tahunStr] = waktu.split('/');
  const hari = parseInt(hariStr, 10);
  const bulan = parseInt(bulanStr, 10);
  const tahun = parseInt(tahunStr, 10);

  let isHariSalah = hari < 1 || hari > 31;
  let isBulanSalah = bulan < 1 || bulan > 12;
  let isTahunSalah = tahun > 45; // misal tahun maksimal 45 (2045)

  if (isHariSalah && isBulanSalah && isTahunSalah) {
    Alert.alert('Gagal Input', 'Hari, Bulan, dan Tahun melebihi batas');
    return false;
  } else if (isHariSalah && isBulanSalah) {
    Alert.alert('Gagal Input', 'Hari dan Bulan melebihi batas');
    return false;
  } else if (isHariSalah && isTahunSalah) {
    Alert.alert('Gagal Input', 'Hari dan Tahun melebihi batas');
    return false;
  } else if (isBulanSalah && isTahunSalah) {
    Alert.alert('Gagal Input', 'Bulan dan Tahun melebihi batas');
    return false;
  } else if (isHariSalah) {
    Alert.alert('Gagal Input', 'Hari melebihi batas (1-31)');
    return false;
  } else if (isBulanSalah) {
    Alert.alert('Gagal Input', 'Bulan melebihi batas 12 atau bulan Desember');
    return false;
  } else if (isTahunSalah) {
    Alert.alert('Gagal Input', 'Tahun melebihi batas (maksimal 45)');
    return false;
  }
  if (ibadah.length < 3) {
    Alert.alert('Gagal Input', 'Nama Ibadahnya kok pendek, yang bener kamu');
    return;
  }

  const newibadah = {
    id: editId || Date.now().toString(),
    ibadah: ibadah.trim(),
    waktu: waktu.trim(),
    isCompleted: false,
    category: category,
  };

  if (editId) {
    // Kalau sedang edit
    Alert.alert(
      'Konfirmasi Edit',
      'Apakah kamu yakin ingin menyimpan perubahan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Simpan',
          onPress: () => {
            const updated = list.map((item) => (item.id === editId ? newibadah : item));
            setList(updated);
            afterSave();
          },
        },
      ]
    );
  } else {
    // Kalau tambah baru
    Alert.alert(
      'Konfirmasi Tambah',
      'Apakah kamu yakin ingin menambahkan ibadah ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tambah',
          onPress: () => {
            setList([...list, newibadah]);
            afterSave();
          },
        },
      ]
    );
  }
};


  // Fungsi untuk reset form setelah save atau tambah
  const afterSave = () => {
    setibadah('');
    setwaktu('');
    setEditId('');
    setCategory('');
    setShowForm(false);
  };


  const toggleComplete = (id: string) => {
    const updatedList = list.map((item) =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setList(updatedList);
  };

  const deleteibadah = (id: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah kamu yakin ingin menghapus tugas ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            const filtered = list.filter(item => item.id !== id);
            setList(filtered);
          },
        },
      ]
    );
  };

  const startEdit = (item: ibadah) => {
    setibadah(item.ibadah);
    setwaktu(item.waktu);
    setEditId(item.id);
    setCategory(item.category);
    setShowForm(true);
  };

  const loadibadahs = async () => {
    try {
      const saved = await AsyncStorage.getItem('ibadahs');
      if (saved !== null) {
        setList(JSON.parse(saved));
        console.log('Berhasil load data');
      }
    } catch (error) {
      console.log('Gagal load:', error);
    }
  };

  useEffect(() => {
    loadibadahs();
  }, []);

  useEffect(() => {
    saveibadahs();
  }, [list]);

  useEffect(() => {
    if (!showForm) {
      setibadah('');
      setwaktu('');
      setEditId('');
      setCategory(''); // 🔥 Tambahin ini!
    }
  }, [showForm]);

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0A1A12]`}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header Section */}
        <View style={tw`px-5 pt-8 pb-4`}>
          <View style={tw`flex-row justify-between items-center mb-8`}>
            <View>
              <Text style={tw`text-[#4ADE80] text-base font-medium`}>Selamat Datang di</Text>
              <Text style={tw`text-white font-bold text-3xl mt-1`}>Umma</Text>
            </View>
            <View style={tw`bg-[#132821] p-3 rounded-full`}>
              <MaterialIcons name="mosque" size={24} color="#4ADE80" />
            </View>
          </View>

          {/* Daily Ayat Card */}
          <View style={tw`bg-[#132821] rounded-3xl p-6 mb-8 shadow-lg`}>
            <Text style={tw`text-[#4ADE80] text-lg font-semibold mb-3`}>Daily Ayat</Text>
            <Text style={tw`text-white text-base leading-6`}>
              "Sesungguhnya Allah bersama orang-orang yang sabar."
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-2 italic`}>Al-Baqarah: 153</Text>
          </View>
        </View>

        {/* Main Content Section */}
        <View style={tw`bg-[#132821] flex-1 rounded-t-3xl px-5 py-6`}>
          {showForm && (
            <View style={tw`bg-[#0A1A12] rounded-2xl p-6 mb-6`}>
              <Text style={tw`text-white text-xl font-bold mb-6`}>
                {editId ? 'Edit Ibadah' : 'Tambah Ibadah'}
              </Text>

              <TextInput
                style={tw`bg-[#132821] border-0 rounded-xl p-4 mb-4 text-white`}
                placeholder="Nama Ibadah"
                placeholderTextColor="#4A5568"
                value={ibadah}
                onChangeText={setibadah}
              />

              <TextInput
                style={tw`bg-[#132821] border-0 rounded-xl p-4 mb-4 text-white`}
                placeholder="Tanggal (dd/mm/yy)"
                placeholderTextColor="#4A5568"
                value={waktu}
                onChangeText={(text) => setwaktu(formatDateInput(text))}
              />


              <View style={tw`bg-[#132821] rounded-xl mb-6`}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={tw`text-white`}
                  dropdownIconColor="#4ADE80"
                >
                  <Picker.Item label="Pilih Kategori Ibadah" value="" />
                  <Picker.Item label="Wajib" value="Wajib" />
                  <Picker.Item label="Sunnah" value="Sunnah" />
                </Picker>
              </View>

              <TouchableOpacity
                disabled={ibadah === '' || waktu === '' || category === ''}
                onPress={addibadah}
                style={tw`p-4 rounded-xl mb-2 ${ibadah === '' || waktu === '' || category === ''
                    ? 'bg-gray-600 opacity-50'
                    : 'bg-[#4ADE80]'
                  }`}
              >
                <Text style={tw`text-[#0A1A12] text-lg text-center font-bold`}>
                  {editId ? 'Simpan Perubahan' : 'Tambah Ibadah'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Filter Section */}
          {list.length > 0 && (
            <>
              <Text style={tw`text-white text-xl font-bold mb-4`}>Daftar Ibadah</Text>
              <View style={tw`bg-[#0A1A12] rounded-xl p-1 mb-6`}>
                <Picker
                  selectedValue={filterCategory}
                  onValueChange={(itemValue) => setFilterCategory(itemValue)}
                  style={tw`text-white`}
                  dropdownIconColor="#4ADE80"
                >
                  <Picker.Item label="Semua Ibadah" value="All" />
                  <Picker.Item label="Ibadah Wajib" value="Wajib" />
                  <Picker.Item label="Ibadah Sunnah" value="Sunnah" />
                </Picker>
              </View>
            </>
          )}

          {/* Empty State */}
          {list.length === 0 ? (
            <>
              <Text style={tw`text-white text-xl font-bold mb-4`}>Daftar Ibadah</Text>
              <View style={tw`items-center justify-center py-8`}>
                <MaterialIcons name="mosque" size={48} color="#4ADE80" style={tw`mb-4 opacity-50`} />
                <Text style={tw`text-gray-400 text-lg text-center`}>
                  Belum ada ibadah yang ditambahkan
                </Text>
                <Text style={tw`text-gray-500 text-base text-center mt-2`}>
                  Mulai tambahkan ibadah Anda
                </Text>
              </View>
            </>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={filteredList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleComplete(item.id)}
                  activeOpacity={0.7}
                  style={tw`mb-4`}
                >
                  <View style={tw`
                    bg-[#0A1A12] 
                    flex-row 
                    justify-between 
                    items-center 
                    p-4 
                    rounded-xl
                    ${item.isCompleted ? 'border border-[#4ADE80]' : ''}
                  `}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <TouchableOpacity
                        onPress={() => toggleComplete(item.id)}
                        style={tw`mr-4`}
                      >
                        {item.isCompleted ? (
                          <View style={tw`bg-[#4ADE80] rounded-full p-2`}>
                            <FontAwesome name="check" size={16} color="#0A1A12" />
                          </View>
                        ) : (
                          <View style={tw`border-2 border-gray-600 rounded-full p-2`}>
                            <FontAwesome name="circle" size={16} color="transparent" />
                          </View>
                        )}
                      </TouchableOpacity>

                      <View style={tw`flex-1`}>
                        <Text style={tw`
                          text-white 
                          text-lg 
                          font-semibold
                          ${item.isCompleted ? 'text-[#4ADE80]' : ''}
                        `}>
                          {item.ibadah}
                        </Text>
                        <Text style={tw`text-gray-500 text-sm mt-1`}>
                          {item.category}
                        </Text>
                        <Text style={tw`text-[#4ADE80] text-base font-medium mt-1`}>
                          {item.waktu}
                        </Text>
                      </View>

                      <View style={tw`flex-row items-center gap-2`}>
                        <TouchableOpacity onPress={() => startEdit(item)}>
                          <View style={tw`bg-[#132821] w-10 h-10 items-center justify-center rounded-lg`}>
                            <MaterialIcons name="edit" size={20} color="#4ADE80" />
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteibadah(item.id)}>
                          <View style={tw`bg-[#1F1F1F] w-10 h-10 items-center justify-center rounded-lg`}>
                            <FontAwesome5 name="trash-alt" size={16} color="#FF4444" />
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<View style={tw`mb-6`} />}
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => setShowForm(!showForm)}
        style={tw`
          absolute 
          z-50 
          right-6 
          bottom-6 
          bg-[#4ADE80] 
          w-14 
          h-14 
          justify-center 
          items-center 
          rounded-full 
          shadow-xl
        `}
      >
        <Text style={tw`text-[#0A1A12] font-bold text-2xl`}>
          {showForm ? '×' : '+'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default index;
